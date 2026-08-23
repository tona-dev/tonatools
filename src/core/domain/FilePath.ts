/**
 * Pure path rules shared across slices. Free of any `vscode` import.
 */

import path from "node:path";

/**
 * `targetFsPath` expressed relative to `rootFsPath`, with forward slashes.
 *
 * Returns `""` when the target *is* the root — callers decide what that means.
 * A file equal to the root is nonsense, but a directory equal to it is normal,
 * so the policy lives at the call site rather than here.
 *
 * Undefined only when the target escapes the root, where a relative path would
 * be actively misleading.
 */
export function toRelativePath(
  rootFsPath: string,
  targetFsPath: string,
): string | undefined {
  const relative = path
    .relative(rootFsPath, targetFsPath)
    .replaceAll("\\", "/");

  if (relative.startsWith("../") || path.isAbsolute(relative)) {
    return undefined;
  }

  return relative;
}
