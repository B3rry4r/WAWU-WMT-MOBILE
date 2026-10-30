import type { ChosenFile } from '@/features/create/chosen';

/** The browser has no camera pick of its own here: the photo row draws only "Choose a photo" (POINTS-14). */
export const canTakePhoto = false;

export async function takePhoto(): Promise<ChosenFile | null | 'refused'> {
  return 'refused';
}
