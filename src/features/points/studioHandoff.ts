import type { ChosenFile } from '@/features/create/chosen';

/**
 * What Studio's home hands to a tool's screen (STUDIO-HOME, R-113): the words typed in the prompt box, the file attached with "+", and the
 * voice chosen beside it. The tool opens with them already in and shows its own quote; nothing is charged on the home. One hand-off at a
 * time, kept in memory only (a file cannot travel in a route), taken once by the tool it names: a tool opened any other way finds none.
 */
export type Handoff = { toolId: string; text: string; file: ChosenFile | null; voiceId: string | null };

let held: Handoff | null = null;

export function putHandoff(handoff: Handoff): void {
  held?.file?.discard?.();
  held = handoff;
}

/** The hand-off for this tool, once; a hand-off that names another tool stays held for that one. */
export function takeHandoff(toolId: string): Handoff | null {
  if (!held || held.toolId !== toolId) return null;
  const out = held;
  held = null;
  return out;
}

/** The person came back to the home or left: a file that was never opened in a tool is let go. */
export function dropHandoff(): void {
  held?.file?.discard?.();
  held = null;
}
