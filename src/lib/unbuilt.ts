/**
 * The one way to write an entry whose screen is not built yet (DECISIONS R-46).
 *
 *   <Row title="Edit profile" onPress={unbuilt('ME-03')} />
 *
 * The entry is drawn exactly as designed and tapping it does nothing: no toast,
 * no log, no navigation, in debug or in release. The argument names the task
 * that builds where the entry leads. `scripts/gates/checks/unbuilt_entries.py`
 * fails the build when that task does not exist or is already built (`review`
 * or `done`), so the task that builds the screen still wires its entry.
 *
 * The id must be one string literal: the gate reads the source, not the types.
 */
export type TaskId = `${Uppercase<string>}-${number}`;

const inert = new Map<TaskId, () => void>();

/** One stable no-op per task id, so it is safe in dependency arrays and memo props. */
export function unbuilt(task: TaskId): () => void {
  let handler = inert.get(task);
  if (!handler) {
    handler = () => undefined;
    inert.set(task, handler);
  }
  return handler;
}
