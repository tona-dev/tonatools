import type { Uri } from "vscode";
import type { UseCaseResult } from "../../core/domain/UseCaseResult";
import { toDirectory } from "../../filesystem/domain/Directory";

export type FileDirectoryToOpenFailure = "untitled-document";

export type FileDirectoryToOpenResult = UseCaseResult<
  string,
  FileDirectoryToOpenFailure
>;

/**
 * Returns the directory path for the given file URI, or fails if the buffer is unsaved.
 */
export function getFileDirectoryToOpen(uri: Uri): FileDirectoryToOpenResult {
  if (uri.scheme === "untitled") {
    return { ok: false, reason: "untitled-document" };
  }

  return { ok: true, value: toDirectory(uri.fsPath) };
}
