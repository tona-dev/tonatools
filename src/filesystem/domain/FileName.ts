/**
 * Pure file-naming rules. Deliberately free of any `vscode` import so it can be
 * unit tested on its own.
 */

import path from "node:path";

/** The name of a file, extension included: `/a/b/c.ts` -> `c.ts`. */
export function toFileName(fsPath: string): string {
  return path.basename(fsPath);
}
