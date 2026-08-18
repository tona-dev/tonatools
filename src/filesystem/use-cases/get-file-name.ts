import type { Uri } from "vscode";
import type { UseCaseResult } from "../../core/domain/UseCaseResult";
import { toFileName } from "../domain/FileName";

export type FileNameFailure = "untitled-document";

export type FileNameResult = UseCaseResult<string, FileNameFailure>;

export function getFileName(uri: Uri): FileNameResult {
  // An unsaved buffer has no path on disk — its fsPath is a label like
  // `Untitled-1`, which would be a misleading thing to hand back as a file name.
  if (uri.scheme === "untitled") {
    return { ok: false, reason: "untitled-document" };
  }

  return { ok: true, value: toFileName(uri.fsPath) };
}
