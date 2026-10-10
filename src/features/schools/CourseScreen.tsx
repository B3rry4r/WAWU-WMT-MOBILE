import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { Card } from '@/components/Card';
import { Money } from '@/components/Money';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { NavBar } from '@/features/events/chrome';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { fetchCourse, schoolsKeys } from './api';
import { classesLine, dayLabel, nonEmpty, todayOf, upcomingIntake, weeksLabel, youGetLine } from './model';
import { Cover } from './parts';

/**
 * design/_gen/schools.js `courseInner`: the body pads 8 above and 20 at the sides with 16 between the parts (`gap: 16`)
 * and 130 below, over a footer; a 170 picture at corner 22; the school's name 13 at 600 muted over the title (`h1` at 24,
 * 4 between); the facts in a card (`kv`: 50 high rows, 14 label, 14.5 value at 600, a hairline between); "What you
 * learn" as the small label with 10 between it and each row, a 24 circle on the sunken colour holding the number (12 at 700)
 * and the line (14) 10 from it; the footer pads 12 above, 20 at the sides and 34 below on the page colour, with the fee at 20.
 * The canvas leaves 130 under the last part for a footer that also holds Enroll; with the fee alone the body leaves the
 * footer's own height and the 16 between parts.
 */
export const courseMetrics = {
  bodyTop: space.sm,
  partGap: 16,
  cover: 170,
  nameGap: 4,
  school: 13,
  title: 24,
  titleTracking: -0.03,
  titleLeading: 1.15,
  kvMin: 50,
  kvPadV: 12,
  kvGap: 14,
  syllabusGap: 10,
  step: 24,
  stepFont: 12,
  stepToLine: 10,
  line: 14,
  footTop: 12,
  footBottom: 34,
  fee: 20,
  skeletonRows: 4,
} as const;

export type CourseScreenProps = {
  id: string;
  onBack: () => void;
};

/**
 * SC3 · Course: the school, the course, its length, how it is taught, when the next class starts, what it gives and what
 * it covers, and the fee in a bar at the foot. Enroll (SCHOOLS-06) and "Or apply on the school's website" (SCHOOLS-08) are
 * added by the tasks that build where they lead (R-47), so the bar holds the fee alone.
 */
export function CourseScreen({ id, onBack }: CourseScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const course = useQuery({ queryKey: schoolsKeys.course(id), queryFn: () => fetchCourse(id) }, queryClient);
  // Today is read once, so the screen does not change under a person reading it at midnight.
  const [today] = useState(() => todayOf(new Date()));

  if (course.isPending) {
    return (
      <Frame onBack={onBack} insetTop={insets.top}>
        <CourseSkeleton />
      </Frame>
    );
  }
  if (course.isError) {
    // A link that is not a course id is refused by the Hub's validator (400); it reads the same as a course that is gone.
    const gone = isApiError(course.error) && (course.error.kind === 'not_found' || course.error.kind === 'validation');
    const offline = isApiError(course.error) && course.error.kind === 'network';
    return (
      <Frame onBack={onBack} insetTop={insets.top}>
        {gone ? (
          <EmptyState testID="course-gone" icon="GraduationCap" title="This course is not available" message="It may have been taken down or never existed." />
        ) : (
          <ErrorState
            testID="course-error"
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
  const intake = upcomingIntake(data.intakes, today);
  const starts = intake ? dayLabel(intake.startDate) : null;
  const youGet = youGetLine(data.outcomes);
  const facts: { key: string; label: string; value: string }[] = [
    { key: 'length', label: 'Length', value: weeksLabel(data.weeks) },
    { key: 'classes', label: 'Classes', value: classesLine(data.mode, intake) },
    ...(starts ? [{ key: 'starts', label: 'Starts', value: starts }] : []),
    ...(youGet === '' ? [] : [{ key: 'you-get', label: 'You get', value: youGet }]),
  ];
  const syllabus = nonEmpty(data.syllabus);
  const footBottom = Math.max(insets.bottom, courseMetrics.footBottom);
  const footHeight = courseMetrics.footTop + courseMetrics.fee + footBottom;

  return (
    <View testID="course-screen" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insets.top }]}>
      <NavBar title="Course" onBack={onBack} backTestID="course-back" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body, { paddingBottom: footHeight + courseMetrics.partGap }]}>
        <Cover height={courseMetrics.cover} style={styles.cover} testID="course-cover" />
        <View style={styles.names}>
          <Text variant="body" tone="textMuted" style={styles.school} testID="course-school">
            {data.school.name}
          </Text>
          <Text variant="body" accessibilityRole="header" style={styles.title} testID="course-title">
            {data.title}
          </Text>
        </View>
        <Card testID="course-facts">
          {facts.map((fact, i) => (
            <View
              key={fact.key}
              testID={`course-fact-${fact.key}`}
              style={[
                styles.kv,
                i > 0 ? { boxShadow: [{ offsetX: 0, offsetY: 1, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }] } : null,
              ]}
            >
              <Text variant="kvLabel" tone="textSecondary" style={styles.kvLabel}>
                {fact.label}
              </Text>
              <Text variant="kvValue" style={styles.kvValue}>
                {fact.value}
              </Text>
            </View>
          ))}
        </Card>
        {syllabus.length > 0 ? (
          <View style={styles.syllabus} testID="course-syllabus">
            <Text variant="label">What you learn</Text>
            {syllabus.map((line, i) => (
              <View key={`${i}-${line}`} style={styles.step} testID={`course-step-${i + 1}`}>
                <View style={[styles.number, { backgroundColor: colors.surfaceSunken }]}>
                  <Text variant="body" style={styles.numberText}>
                    {i + 1}
                  </Text>
                </View>
                <Text variant="body" style={styles.stepText}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <View testID="course-foot" style={[styles.foot, { backgroundColor: colors.surfacePage, paddingBottom: footBottom }]}>
        <Money minorUnits={data.priceKobo} decimals={false} size={courseMetrics.fee} testID="course-price" />
      </View>
    </View>
  );
}

/** The bar and what stands in for the course: its loading shapes, or the words that say it could not be read. */
function Frame({ onBack, insetTop, children }: { onBack: () => void; insetTop: number; children: ReactNode }) {
  const { colors } = useWawu();
  return (
    <View testID="course-frame" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insetTop }]}>
      <NavBar title="Course" onBack={onBack} backTestID="course-back" />
      <View style={styles.frameBody}>{children}</View>
    </View>
  );
}

function CourseSkeleton() {
  return (
    <LoadingView label="Loading the course" testID="course-loading">
      <View style={styles.skeleton}>
        <Skeleton height={courseMetrics.cover} radius={radius.card} />
        <Skeleton width="40%" height={courseMetrics.school} />
        <Skeleton width="75%" height={courseMetrics.title} />
        {Array.from({ length: courseMetrics.skeletonRows }, (_, i) => (
          <Skeleton key={i} height={courseMetrics.kvMin} />
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingTop: courseMetrics.bodyTop, paddingHorizontal: layout.gutter, gap: courseMetrics.partGap },
  cover: { borderRadius: radius.card },
  names: { gap: courseMetrics.nameGap },
  school: { ...font(600), fontSize: courseMetrics.school, lineHeight: canvasNormalLineHeight(courseMetrics.school) },
  title: { ...font(700), fontSize: courseMetrics.title, letterSpacing: courseMetrics.titleTracking * courseMetrics.title, lineHeight: courseMetrics.title * courseMetrics.titleLeading },
  kv: { minHeight: courseMetrics.kvMin, paddingVertical: courseMetrics.kvPadV, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: courseMetrics.kvGap },
  kvLabel: { flexShrink: 0 },
  kvValue: { flexShrink: 1, textAlign: 'right' },
  syllabus: { gap: courseMetrics.syllabusGap },
  step: { flexDirection: 'row', alignItems: 'center', gap: courseMetrics.stepToLine },
  number: { width: courseMetrics.step, height: courseMetrics.step, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  numberText: { ...font(700), fontSize: courseMetrics.stepFont, lineHeight: canvasNormalLineHeight(courseMetrics.stepFont) },
  stepText: { flex: 1, fontSize: courseMetrics.line, lineHeight: canvasNormalLineHeight(courseMetrics.line) },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: courseMetrics.footTop, paddingHorizontal: layout.gutter },
  frameBody: { flex: 1 },
  skeleton: { paddingHorizontal: layout.gutter, paddingTop: courseMetrics.bodyTop, gap: courseMetrics.partGap },
});
