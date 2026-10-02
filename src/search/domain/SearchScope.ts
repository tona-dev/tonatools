/**
 * Pure search-scope rules. Deliberately free of any `vscode` import so it can
 * be unit tested on its own.
 */

/**
 * A workspace-relative directory followed by each of its parents, nearest
 * first: `a/b/c` -> `["a/b/c", "a/b", "a"]`. The workspace root itself is left
 * out — searching it is just the regular Search.
 */
export function toAncestorDirectories(relativeDir: string): string[] {
  const segments = relativeDir
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".");

  return segments.map((_, index) =>
    segments.slice(0, segments.length - index).join("/"),
  );
}

/**
 * The "files to include" value for the Search view. The `./` prefix makes VS
 * Code read it relative to the workspace folder instead of as a `**` glob that
 * could match a same-named directory elsewhere. In a multi-root workspace the
 * folder name has to lead, so pass it only then.
 */
export function toFilesToInclude(
  relativeDir: string,
  workspaceFolderName?: string,
): string {
  return workspaceFolderName
    ? `./${workspaceFolderName}/${relativeDir}`
    : `./${relativeDir}`;
}
