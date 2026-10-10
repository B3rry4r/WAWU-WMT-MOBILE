import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isApiError } from '@/api/errors';
import { queryClient } from '@/api/query';
import { IconButton, pressScale } from '@/components/Button';
import { useFocusRing } from '@/components/focusRing';
import { Icon } from '@/components/icon';
import { LoadingView, Skeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateViews';
import { Text } from '@/components/Text';
import { NavBar } from '@/features/events/chrome';
import { canvasNormalLineHeight, font, layout, radius, space, useWawu } from '@/theme';

import { fetchSchool, schoolsKeys, type CourseCard } from './api';
import { courseLine, feeText, profileLine } from './model';
import { Cover, Fee, SchoolLogo } from './parts';
import { useToday } from './useToday';

/**
 * design/_gen/schools.js `schTop` and `profile`: a 200 picture to the top edge with a fade from 35% black over its first
 * 45%, a 42 glass button each side 6 under the status bar; then 18 below the picture a 64 logo (corner 18), and 14 between
 * the parts: the name 24 at 700 (-0.03em, on the canvas's normal line), the line under it 13.5 in the secondary colour (4 below); the expertise as
 * 30 high pills, 12 across, 13 at 600, 6 apart; the about text 14 on a 1.5 line in the secondary colour; the heading
 * "Courses" with the count at its right in the accent (13.5 at 600); and `crs` rows: 12 above and below with a hairline
 * under each, 12 between the words (the name 15 at 600, the line under it 12.5 muted, 2 below), the fee 14.5 (its kobo only
 * when it has some; "Free" for nothing) and a 16 chevron. The words sit on the canvas's normal line.
 */
export const schoolMetrics = {
  hero: 200,
  fadeEnd: 0.45,
  topInset: 6,
  logoTop: 18,
  logo: 64,
  logoCorner: 18,
  logoInitials: 22,
  partGap: 14,
  nameBlock: 4,
  name: 24,
  nameTracking: -0.03,
  line: 13.5,
  pillHeight: 30,
  pillPadH: 12,
  pillGap: 6,
  pillFont: 13,
  about: 14,
  aboutLeading: 1.5,
  count: 13.5,
  courseNamePad: 12,
  courseGap: 12,
  courseName: 15,
  courseLine: 12.5,
  courseLineGap: 2,
  coursePrice: 14.5,
  chevron: 16,
  bottom: 40,
  skeletonCourses: 3,
} as const;

export type SchoolScreenProps = {
  id: string;
  onBack: () => void;
  /** A course was tapped: its page (SC3). */
  onOpenCourse: (id: string) => void;
};

/** SC2 · School: the school's logo, name, place, what it teaches, its about text and its courses. No rating (R-32). */
export function SchoolScreen({ id, onBack, onOpenCourse }: SchoolScreenProps) {
  const { colors } = useWawu();
  const insets = useSafeAreaInsets();
  const school = useQuery({ queryKey: schoolsKeys.school(id), queryFn: () => fetchSchool(id) }, queryClient);
  const today = useToday();

  if (school.isPending) {
    return (
      <Frame onBack={onBack} insetTop={insets.top}>
        <SchoolSkeleton />
      </Frame>
    );
  }
  if (school.isError) {
    // A link that is not a school id is refused by the Hub's validator (400); it reads the same as a school that is gone.
    const gone = isApiError(school.error) && (school.error.kind === 'not_found' || school.error.kind === 'validation');
    const offline = isApiError(school.error) && school.error.kind === 'network';
    return (
      <Frame onBack={onBack} insetTop={insets.top}>
        {gone ? (
          <EmptyState testID="school-gone" icon="GraduationCap" title="This school is not available" message="It may have been taken down or never existed." />
        ) : (
          <ErrorState
            testID="school-error"
            title="Couldn’t load this school"
            message={offline ? 'No connection. Check your internet and try again.' : isApiError(school.error) ? school.error.message : 'Something went wrong. Try again.'}
            icon={offline ? 'WifiOff' : 'TriangleAlert'}
            onRetry={() => void school.refetch()}
          />
        )}
      </Frame>
    );
  }

  const data = school.data;
  const share = () => {
    Share.share({ message: [data.name, data.location].join('\n') }).catch(() => undefined);
  };

  return (
    <View testID="school-screen" style={[styles.root, { backgroundColor: colors.surfacePage }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + schoolMetrics.bottom }}>
        <Hero insetTop={insets.top} onBack={onBack} onShare={share} />
        <View style={styles.body}>
          <SchoolLogo
            school={data}
            size={schoolMetrics.logo}
            corner={schoolMetrics.logoCorner}
            initials={schoolMetrics.logoInitials}
            ring={{ width: 0, color: 'surfacePage' }}
            style={styles.logo}
            testID="school-logo"
          />
          <View>
            <Text variant="body" accessibilityRole="header" style={styles.name} testID="school-name">
              {data.name}
            </Text>
            <Text variant="body" tone="textSecondary" style={styles.line} testID="school-line">
              {profileLine(data)}
            </Text>
          </View>
          {data.expertise.length > 0 ? (
            <View style={styles.pills} testID="school-expertise">
              {data.expertise.map((tag, i) => (
                <View key={`${tag}-${i}`} style={[styles.pill, { boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 0, spreadDistance: 1, color: colors.borderStrong, inset: true }] }]}>
                  <Text variant="body" style={styles.pillText}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {data.about.trim() === '' ? null : (
            <Text variant="body" tone="textSecondary" style={styles.about} testID="school-about">
              {data.about}
            </Text>
          )}
          <View style={styles.heading}>
            <Text variant="h2" accessibilityRole="header">
              Courses
            </Text>
            <Text variant="body" tone="accentFg" style={styles.count} testID="school-course-count">
              {data.courseCount}
            </Text>
          </View>
          <View testID="school-courses">
            {data.courses.length === 0 ? (
              <Text variant="muted" testID="school-no-courses">
                No courses listed yet.
              </Text>
            ) : (
              data.courses.map((course) => <CourseRow key={course.id} course={course} today={today} onPress={() => onOpenCourse(course.id)} />)
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Hero({ insetTop, onBack, onShare }: { insetTop: number; onBack: () => void; onShare: () => void }) {
  const { gradients } = useWawu();
  const fade = gradients.scrimFeed;
  return (
    <View>
      <Cover height={schoolMetrics.hero} testID="school-hero" />
      <LinearGradient pointerEvents="none" colors={[fade.colors[0], fade.colors[1]]} locations={[0, schoolMetrics.fadeEnd]} style={StyleSheet.absoluteFill} />
      <View style={[styles.heroBar, { paddingTop: insetTop + schoolMetrics.topInset }]}>
        <IconButton icon="ChevronLeft" label="Back" tone="glass" onPress={onBack} testID="school-back" />
        <IconButton icon="Share" label="Share this school" tone="glass" onPress={onShare} testID="school-share" />
      </View>
    </View>
  );
}

/** One course: its name, its length, how it is taught and its days while a class is coming, its fee, and a chevron. */
export function CourseRow({ course, today, onPress }: { course: CourseCard; today: string; onPress: () => void }) {
  const { colors } = useWawu();
  const ring = useFocusRing();
  const label = `${course.title}, ${courseLine(course, today)}, ${feeText(course.priceKobo)}`;
  return (
    <Pressable
      testID={`school-course-${course.id}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      {...ring.handlers}
      style={({ pressed }) => [
        styles.course,
        {
          backgroundColor: pressed ? colors.surfaceSunken : 'transparent',
          boxShadow: [{ offsetX: 0, offsetY: -1, blurRadius: 0, spreadDistance: 0, color: colors.borderHairline, inset: true }],
          transform: [{ scale: pressed ? pressScale : 1 }],
        },
        ring.style,
      ]}
    >
      <View style={styles.courseWords}>
        <Text variant="body" style={styles.courseName}>
          {course.title}
        </Text>
        <Text variant="body" tone="textMuted" style={styles.courseLine}>
          {courseLine(course, today)}
        </Text>
      </View>
      <Fee kobo={course.priceKobo} size={schoolMetrics.coursePrice} testID={`school-course-price-${course.id}`} />
      <Icon name="ChevronRight" size={schoolMetrics.chevron} color={colors.textMuted} />
    </Pressable>
  );
}

/** The bar and what stands in for the school: its loading shapes, or the words that say it could not be read. */
function Frame({ onBack, insetTop, children }: { onBack: () => void; insetTop: number; children: ReactNode }) {
  const { colors } = useWawu();
  return (
    <View testID="school-frame" style={[styles.root, { backgroundColor: colors.surfacePage, paddingTop: insetTop }]}>
      <NavBar title="School" onBack={onBack} backTestID="school-back" />
      <View style={styles.frameBody}>{children}</View>
    </View>
  );
}

function SchoolSkeleton() {
  return (
    <LoadingView label="Loading the school" testID="school-loading">
      <View style={styles.skeleton}>
        <Skeleton width={schoolMetrics.logo} height={schoolMetrics.logo} radius={schoolMetrics.logoCorner} />
        <Skeleton width="70%" height={schoolMetrics.name} />
        <Skeleton width="50%" height={schoolMetrics.line} />
        {Array.from({ length: schoolMetrics.skeletonCourses }, (_, i) => (
          <Skeleton key={i} height={schoolMetrics.courseName * 3} />
        ))}
      </View>
    </LoadingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: layout.gutter },
  body: { paddingTop: schoolMetrics.logoTop, paddingHorizontal: layout.gutter, gap: schoolMetrics.partGap },
  logo: { alignSelf: 'flex-start' },
  name: { ...font(700), fontSize: schoolMetrics.name, letterSpacing: schoolMetrics.nameTracking * schoolMetrics.name, lineHeight: canvasNormalLineHeight(schoolMetrics.name) },
  line: { fontSize: schoolMetrics.line, lineHeight: canvasNormalLineHeight(schoolMetrics.line), marginTop: schoolMetrics.nameBlock },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: schoolMetrics.pillGap },
  pill: { height: schoolMetrics.pillHeight, paddingHorizontal: schoolMetrics.pillPadH, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  pillText: { ...font(600), fontSize: schoolMetrics.pillFont, lineHeight: canvasNormalLineHeight(schoolMetrics.pillFont) },
  about: { fontSize: schoolMetrics.about, lineHeight: schoolMetrics.about * schoolMetrics.aboutLeading },
  heading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md },
  count: { ...font(600), fontSize: schoolMetrics.count, lineHeight: canvasNormalLineHeight(schoolMetrics.count) },
  course: { flexDirection: 'row', alignItems: 'center', gap: schoolMetrics.courseGap, paddingVertical: schoolMetrics.courseNamePad },
  courseWords: { flex: 1, minWidth: 0 },
  courseName: { ...font(600), fontSize: schoolMetrics.courseName, lineHeight: canvasNormalLineHeight(schoolMetrics.courseName) },
  courseLine: { fontSize: schoolMetrics.courseLine, lineHeight: canvasNormalLineHeight(schoolMetrics.courseLine), marginTop: schoolMetrics.courseLineGap },
  frameBody: { flex: 1 },
  skeleton: { paddingHorizontal: layout.gutter, paddingTop: schoolMetrics.partGap, gap: schoolMetrics.partGap },
});
