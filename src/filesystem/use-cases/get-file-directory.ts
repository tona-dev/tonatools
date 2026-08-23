import type { Uri } from "vscode";
import { toRelativePath } from "../../core/domain/FilePath";
import type { UseCaseResult } from "../../core/domain/UseCaseResult";
import { toDirectory } from "../domain/Directory";

export type FileDirectoryFailure = "untitled-document";

export type FileDirectoryResult = UseCaseResult<string, FileDirectoryFailure>;

/**
 * The active file's directory, relative to its workspace folder when it has
 * one. Falls back to the absolute path rather than failing, so the command
 * still does something useful for a file opened from outside the workspace.
 */
export function getFileDirectory(
  uri: Uri,
  workspaceRootFsPath: string | undefined,
): FileDirectoryResult {
  // An unsaved buffer has no path on disk, so it has no directory either.
  if (uri.scheme === "untitled") {
    return { ok: false, reason: "untitled-document" };
  }

  const directory = toDirectory(uri.fsPath);

  if (!workspaceRootFsPath) {
    return { ok: true, value: directory };
  }

  const relative = toRelativePath(workspaceRootFsPath, directory);

  if (relative === undefined) {
    return { ok: true, value: directory };
  }

  // "" means the file sits at the workspace root. `.` says that in a form you
  // can paste into a terminal; an empty clipboard would just look broken.
  return { ok: true, value: relative === "" ? "." : relative };
}
