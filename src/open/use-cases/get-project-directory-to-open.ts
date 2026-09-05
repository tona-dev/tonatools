import type { Uri } from "vscode";
import { toRelativePath } from "../../core/domain/FilePath";
import type { UseCaseResult } from "../../core/domain/UseCaseResult";

export type ProjectDirectoryFailure = "no-workspace";

export type ProjectDirectoryResult = UseCaseResult<
  string,
  ProjectDirectoryFailure
>;

export interface ProjectDirectoryContext {
  readonly activeFileUri?: Uri;
  readonly workspaceFolders?: ReadonlyArray<{ uri: Uri }>;
  readonly gitRootUri?: Uri;
}

/**
 * Resolves the appropriate project / workspace root directory to open.
 * Matches the active file against workspace folders or git repo first,
 * then falls back to the first workspace folder or git repo root.
 */
export function getProjectDirectoryToOpen(
  context: ProjectDirectoryContext,
): ProjectDirectoryResult {
  const { activeFileUri, workspaceFolders, gitRootUri } = context;

  // 1. If an active file is open, match against workspace folders
  if (
    activeFileUri &&
    activeFileUri.scheme !== "untitled" &&
    workspaceFolders &&
    workspaceFolders.length > 0
  ) {
    for (const folder of workspaceFolders) {
      if (
        toRelativePath(folder.uri.fsPath, activeFileUri.fsPath) !== undefined
      ) {
        return { ok: true, value: folder.uri.fsPath };
      }
    }
  }

  // 2. If active file is open and inside git root
  if (activeFileUri && activeFileUri.scheme !== "untitled" && gitRootUri) {
    if (toRelativePath(gitRootUri.fsPath, activeFileUri.fsPath) !== undefined) {
      return { ok: true, value: gitRootUri.fsPath };
    }
  }

  // 3. Fallback to the first workspace folder
  if (workspaceFolders && workspaceFolders.length > 0) {
    return { ok: true, value: workspaceFolders[0].uri.fsPath };
  }

  // 4. Fallback to git root
  if (gitRootUri) {
    return { ok: true, value: gitRootUri.fsPath };
  }

  return { ok: false, reason: "no-workspace" };
}
