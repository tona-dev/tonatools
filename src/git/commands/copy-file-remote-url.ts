import * as vscode from "vscode";
import { copyToClipboard } from "../../core/infra/copy-to-clipboard";
import { getGitApi } from "../../core/repositories/git-extension";
import type { LineRange, RemoteTemplate } from "../domain/RemoteUrl";
import {
  getFileRemoteUrl,
  type FileRemoteUrlFailure,
} from "../use-cases/get-file-remote-url";

const commandId = "tonatools.git.copyremoteurl";

const failureMessages: Readonly<Record<FileRemoteUrlFailure, string>> = {
  "no-repository": "This file is not inside a git repository.",
  "no-branch": "No branch checked out — HEAD is detached.",
  "no-remote": "This repository has no remotes configured.",
  "unsupported-remote": "Could not read a host out of the remote URL.",
  "file-outside-repository": "This file sits outside the repository root.",
};

export function registerCopyFileRemoteUrl(): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async () => {
    const api = getGitApi();

    if (!api) {
      vscode.window.showErrorMessage("VSCode's git extension is not enabled");
      return;
    }

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage("Open a file first.");
      return;
    }

    const result = getFileRemoteUrl(
      api,
      editor.document.uri,
      toLineRange(editor.selection),
      readRemoteTemplates(),
    );

    if (!result.ok) {
      vscode.window.showErrorMessage(failureMessages[result.reason]);
      return;
    }

    await copyToClipboard(result.value);
  });
}

/**
 * Editor positions are 0-based, remote line anchors are 1-based.
 *
 * Dragging across whole lines leaves the cursor at column 0 of the line *after*
 * the last one you meant, so that trailing line is dropped — otherwise the link
 * claims a line you never selected.
 */
function toLineRange(selection: vscode.Selection): LineRange {
  const start = selection.start.line;
  const end =
    selection.end.character === 0 && selection.end.line > start
      ? selection.end.line - 1
      : selection.end.line;

  return { start: start + 1, end: end + 1 };
}

function readRemoteTemplates(): Readonly<
  Record<string, Partial<RemoteTemplate>>
> {
  return vscode.workspace
    .getConfiguration("tonatools.git")
    .get<Record<string, Partial<RemoteTemplate>>>("remoteTemplates", {});
}
