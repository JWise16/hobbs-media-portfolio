/**
 * `todo(label, value)` marks a fact Sam has not confirmed (eng 6A, design 11).
 * It returns the value unchanged so review builds render it, and registers the
 * label so scripts/guard.ts can print every remaining placeholder and refuse a
 * SITE_STAGE=live build while any remain.
 *
 * Confirmed facts are unwrapped, never "marked confirmed": the absence of
 * todo() is the confirmation.
 */

export interface TodoEntry {
  label: string;
  value: string;
}

const registry = new Map<string, TodoEntry>();

export function todo<T extends string | number | readonly string[]>(label: string, value: T): T {
  if (!registry.has(label)) {
    registry.set(label, { label, value: Array.isArray(value) ? value.join(" / ") : String(value) });
  }
  return value;
}

/** Every placeholder registered so far, in registration order. */
export function todos(): TodoEntry[] {
  return [...registry.values()];
}

/** Test hook. */
export function resetTodos(): void {
  registry.clear();
}
