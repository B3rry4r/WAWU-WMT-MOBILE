import type { DraftLesson } from './draft';

/** `4:12` or `1:20:05`: the length as a player writes it. This is the Hub's own pattern (`DURATION_PATTERN`); it refuses the rest in words. */
const DURATION = /^(\d{1,2}:)?[0-5]?\d:[0-5]\d$/;

/** A length is optional; when typed it must read as a player writes it. */
export const durationOk = (typed: string): boolean => typed.trim() === '' || DURATION.test(typed.trim());

/** What a lesson needs before the course can go on: a title, a file that has landed, and a length that reads right when there is one. */
export const lessonReady = (l: Pick<DraftLesson, 'title' | 'duration' | 'file'>): boolean => l.title.trim().length > 0 && l.file !== null && durationOk(l.duration);

/** The course can go on once it has a lesson and every lesson is ready. */
export const lessonsReady = (lessons: readonly Pick<DraftLesson, 'title' | 'duration' | 'file'>[]): boolean => lessons.length > 0 && lessons.every(lessonReady);

/** The first lesson is the free one, but only when there is a lesson after it (the Hub opens none of a course of one). */
export const isFreeLesson = (index: number, count: number): boolean => index === 0 && count > 1;
