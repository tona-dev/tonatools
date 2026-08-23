/**
 * Pure directory rules. Deliberately free of any `vscode` import so it can be
 * unit tested on its own.
 */

import path from "node:path";

/** The directory holding a file: `/a/b/c.ts` -> `/a/b`. */
export function toDirectory(fsPath: string): string {
  return path.dirname(fsPath);
}
