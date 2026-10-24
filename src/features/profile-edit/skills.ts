import { limits } from './limits';

/** What typing a skill did: the new list, and the sentence to show when the typed words were not added. */
export type SkillAdded = { list: string[]; problem?: string };

/**
 * One skill typed into M8's Skills and expertise box (FIX-113). The words are trimmed and a run of spaces counts as one; an
 * empty box adds nothing and says nothing; a skill already on the list (ignoring case) or one past the Hub's lengths is
 * refused in words, and the list stays as it was.
 */
export function addSkill(list: readonly string[], typed: string): SkillAdded {
  const skill = typed.trim().replace(/\s+/g, ' ');
  if (skill === '') return { list: [...list] };
  if (skill.length > limits.skill) return { list: [...list], problem: `A skill can be at most ${limits.skill} characters.` };
  if (list.some((have) => have.toLowerCase() === skill.toLowerCase())) return { list: [...list], problem: 'That skill is already on your list.' };
  if (list.length >= limits.skills) return { list: [...list], problem: `You can list up to ${limits.skills} skills. Remove one to add another.` };
  return { list: [...list, skill] };
}

export function removeSkill(list: readonly string[], skill: string): string[] {
  return list.filter((have) => have !== skill);
}
