import type { Uri } from "vscode";
import { toRelativePath } from "../../core/domain/FilePath";
import type { UseCaseResult } from "../../core/domain/UseCaseResult";
import { toDirectory } from "../../filesystem/domain/Directory";
import { toAncestorDirectories } from "../domain/SearchScope";

export type SearchDirectoriesFailure =
  | "untitled-document"
  | "outside-workspace"
  | "workspace-root";

export type SearchDirectoriesResult = UseCaseResult<
  string[],
  SearchDirectoriesFailure
>;

/**
 * The active file's directory and each of its parents, relative to its
 * workspace folder, nearest first. Unlike copying a directory there is no
 * absolute fallback: the Search view can only scope inside the workspace.
 */
export function getSearchDirectories(
  uri: Uri,
  workspaceRootFsPath: string | undefined,
): SearchDirectoriesResult {
  if (uri.scheme === "untitled") {
    return { ok: false, reason: "untitled-document" };
  }

  if (!workspaceRootFsPath) {
    return { ok: false, reason: "outside-workspace" };
  }

  const relative = toRelativePath(workspaceRootFsPath, toDirectory(uri.fsPath));

  if (relative === undefined) {
    return { ok: false, reason: "outside-workspace" };
  }

  const directories = toAncestorDirectories(relative);

  // A file at the workspace root has no directory narrower than the root.
  if (directories.length === 0) {
    return { ok: false, reason: "workspace-root" };
  }

  return { ok: true, value: directories };
}
