import { useQuery } from '@tanstack/react-query';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Button } from '@/components/Button';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { fetchMe, settingsKeys } from '@/features/settings/api/hub';
import { maskPhone } from '@/features/settings/phone';
import { useSignedIn } from '@/features/settings/sessionGuard';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { fetchCourse, schoolsKeys, type IntakeView } from './api';
import { enrol, type EnrolOutcome } from './enrolApi';
import { NOT_HELD_LINE, joinable, upcoming } from './enrolModel';
import { ClassFullFoot, ClassOption, DetailRow, DetailsCard, EnrolBar, EnrolFoot, enrolMetrics } from './enrolParts';
import { useToday } from './useToday';

export type EnrolScreenProps = {
  courseId: string;
  /** The class SC3 offered: picked when it can still be joined. */
  intakeId?: string;
  onBack: () => void;
  /** A place is held (or a course with no fee enrolled): SC5, or SC7 for a course with no fee. */
  onHeld: (enrolmentId: string) => void;
  /** The student already has this course: open that enrolment. */
  onOpen: (enrolmentId: string) => void;
};

/** What SC11 says once a class turns out full at Continue: the class that was full and the one that has a seat. */
type FullState = { fullStart: string; next: IntakeView | null };

/**
 * SC4 · Your details, and SC11 · Class full when the class fills as Continue is tapped. Enroll step 1: the name, email and masked
 * phone from the account (nothing to type), the classes that have not started as a radio list, the line that says the school
 * gets these details, and Continue. Continue holds a place (`POST /schools/enrolments`) and leads to SC5; it takes nothing from
 * the wallet. A class that is full says so, with the next one that has a seat and "Enroll for <month>", and nothing was taken.
 */
export function EnrolScreen({ courseId, intakeId, onBack, onHeld, onOpen }: EnrolScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const signedIn = useSignedIn();
  const course = useQuery({ queryKey: schoolsKeys.course(courseId), queryFn: () => fetchCourse(courseId) }, queryClient);
  const me = useQuery({ queryKey: settingsKeys.me, queryFn: fetchMe, enabled: signedIn }, queryClient);
  const today = useToday();
  const [picked, setPicked] = useState<string | null>(null);
  const [full, setFull] = useState<FullState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const busy = useRef(false);

  const classes = course.data ? upcoming(course.data.intakes, today) : [];
  // The class asked for, else the soonest that has a seat: until the person picks another.
  const fallback = classes.find((c) => c.id === intakeId && joinable(c, today)) ?? classes.find((c) => joinable(c, today)) ?? null;
  const chosen = picked !== null && classes.some((c) => c.id === picked && joinable(c, today)) ? picked : (fallback?.id ?? null);

  if (course.isPending) {
    return (
      <Frame onBack={onBack} insetTop={insets.top}>
        <EnrolSkeleton />
      </Frame>
    );
  }
  if (course.isError) {
    const gone = isApiError(course.error) && (course.error.kind === 'not_found' || course.error.kind === 'validation');
    const offline = isApiError(course.error) && course.error.kind === 'network';
    return (
      <Frame onBack={onBack} insetTop={insets.top}>
        {gone ? (
          <EmptyState testID="enrol-gone" icon="GraduationCap" title="This course is not available" message="It may have been taken down or never existed." />
        ) : (
          <ErrorState
            testID="enrol-error"
            title="Couldn’t load this course"
            message={offline ? 'No connection. Check your internet and try again.' : isApiError(course.error) ? course.error.message : 'Something went wrong. Try again.'}
            icon={offline ? 'WifiOff' : 'TriangleAlert'}
            onRetry={() => void course.refetch()}
          />
        )}
      </Frame>
    );
  }

  const data = course.data;
  const school = data.school.name;

  const settle = (outcome: EnrolOutcome, from: IntakeView | null) => {
    if (outcome.kind === 'held') {
      void queryClient.invalidateQueries({ queryKey: schoolsKeys.course(courseId) });
      void queryClient.invalidateQueries({ queryKey: ['schools', 'enrolments'] });
      onHeld(outcome.enrolment.id);
      return;
    }
    if (outcome.kind === 'already_enrolled' && outcome.enrolmentId) {
      onOpen(outcome.enrolmentId);
      return;
    }
    if (outcome.kind === 'class_full') {
      // Nothing was taken. The classes are read again, so the full one is drawn as full from now on.
      void queryClient.invalidateQueries({ queryKey: schoolsKeys.course(courseId) });
      setFull({ fullStart: from?.startDate ?? '', next: outcome.nextIntake });
      return;
    }
    setNotice(outcome.kind === 'unanswered' ? NOT_HELD_LINE : outcome.message);
  };

  const hold = async (intake: IntakeView) => {
    if (busy.current) return;
    busy.current = true;
    setStarting(true);
    setNotice(null);
    let leaving = false;
    try {
      const outcome = await enrol(intake.id);
      leaving = outcome.kind === 'held' || (outcome.kind === 'already_enrolled' && outcome.enrolmentId !== null);
      settle(outcome, intake);
    } finally {
      // A place held (or an enrolment found) leaves this page: the tap stays spent until the page is gone, so a second tap holds nothing.
      if (!leaving) {
        busy.current = false;
        setStarting(false);
      }
    }
  };

  const picking = classes.find((c) => c.id === chosen) ?? null;
  const name = [me.data?.firstName, me.data?.lastName].filter(Boolean).join(' ');
  const phone = maskPhone(me.data?.phone);

  return (
    <View testID="enrol-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <EnrolBar course={data.title} onBack={onBack} backTestID="enrol-back" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <DetailsCard testID="enrol-account">
          <View style={styles.badge}>
            <Icon name="BadgeCheck" size={16} color={colors.positive} strokeWidth={2.2} />
            <Text variant="body" tone="positive" style={styles.badgeText}>
              From your Who Made This? account
            </Text>
          </View>
          {me.data ? (
            <>
              {name ? <DetailRow testID="enrol-name" label="Name" value={name} /> : null}
              {me.data.email ? <DetailRow testID="enrol-email" label="Email" value={me.data.email} /> : null}
              {phone ? <DetailRow testID="enrol-phone" label="Phone" value={phone} /> : null}
            </>
          ) : me.isError ? (
            <Pressable testID="enrol-me-retry" accessibilityRole="button" accessibilityLabel="Your details did not load. Try again" onPress={() => void me.refetch()} style={styles.meRetry}>
              <Text variant="body" style={font(600)}>
                Your details did not load
              </Text>
              <Text variant="secondary" tone="accentFg">
                Try again
              </Text>
            </Pressable>
          ) : (
            <View testID="enrol-me-loading" style={styles.meLoading}>
              <Skeleton height={enrolMetrics.row - 14} />
              <Skeleton height={enrolMetrics.row - 14} />
              <Skeleton height={enrolMetrics.row - 14} />
            </View>
          )}
        </DetailsCard>
        {classes.length > 0 ? (
          <View style={styles.classes} testID="enrol-classes">
            <Text variant="label">Pick a class</Text>
            {classes.map((intake) => (
              <ClassOption
                key={intake.id}
                testID={`enrol-class-${intake.id}`}
                intake={intake}
                selected={intake.id === chosen}
                disabled={!joinable(intake, today)}
                onPress={() => {
                  setFull(null);
                  setNotice(null);
                  setPicked(intake.id);
                }}
              />
            ))}
          </View>
        ) : (
          <EmptyState testID="enrol-no-class" icon="CalendarX" title="No class is open to join" message="This course has no class to start. Check back soon." />
        )}
        {classes.length > 0 ? (
          <Text variant="muted" testID="enrol-disclosure" style={styles.disclosure}>
            {school} gets these details so they can follow up with you.
          </Text>
        ) : null}
      </ScrollView>
      {classes.length > 0 ? (
        <EnrolFoot testID="enrol-foot">
          {full ? (
            <ClassFullFoot
              testID="enrol-full"
              fullStart={full.fullStart}
              next={full.next}
              busy={starting}
              onEnrollNext={() => {
                if (!full.next) return;
                setFull(null);
                setPicked(full.next.id);
                void hold(full.next);
              }}
            />
          ) : (
            <>
              {notice ? (
                <Text variant="errorLine" testID="enrol-notice" accessibilityRole="alert">
                  {notice}
                </Text>
              ) : null}
              <Button testID="enrol-continue" label="Continue" full loading={starting} disabled={!picking || !me.data} onPress={() => picking && void hold(picking)} />
            </>
          )}
        </EnrolFoot>
      ) : null}
    </View>
  );
}

/** The bar and what stands in for the course: its loading shapes, or the words that say it could not be read. */
function Frame({ onBack, insetTop, children }: { onBack: () => void; insetTop: number; children: ReactNode }) {
  const { colors } = useWawu();
  return (
    <View testID="enrol-frame" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insetTop }]}>
      <EnrolBar onBack={onBack} backTestID="enrol-back" />
      <View style={styles.frameBody}>{children}</View>
    </View>
  );
}

function EnrolSkeleton() {
  return (
    <LoadingView label="Loading the course" testID="enrol-loading">
      <View style={styles.skeleton}>
        <Skeleton height={210} radius={radius.card} />
        <Skeleton width="30%" height={14} />
        <Skeleton height={72} radius={enrolMetrics.classCorner} />
        <Skeleton height={72} radius={enrolMetrics.classCorner} />
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingTop: enrolMetrics.bodyTop, paddingHorizontal: layout.gutter, paddingBottom: space.lg, gap: enrolMetrics.partGap },
  badge: { flexDirection: 'row', alignItems: 'center', gap: enrolMetrics.badgeGap, minHeight: 24 },
  badgeText: { ...font(700), fontSize: enrolMetrics.badgeText, lineHeight: canvasNormalLineHeight(enrolMetrics.badgeText) },
  meRetry: { minHeight: enrolMetrics.row, justifyContent: 'center' },
  meLoading: { gap: space.md, paddingVertical: space.md },
  classes: { gap: enrolMetrics.classGap },
  disclosure: { fontSize: 14, lineHeight: canvasNormalLineHeight(14) * 1.3 },
  frameBody: { flex: 1 },
  skeleton: { paddingHorizontal: layout.gutter, paddingTop: enrolMetrics.bodyTop, gap: enrolMetrics.partGap },
});
