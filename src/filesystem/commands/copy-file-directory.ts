import * as vscode from "vscode";
import { copyToClipboard } from "../../core/infra/copy-to-clipboard";
import {
  getFileDirectory,
  type FileDirectoryFailure,
} from "../use-cases/get-file-directory";

const commandId = "tonatools.filesystem.cfd";

const failureMessages: Readonly<Record<FileDirectoryFailure, string>> = {
  "untitled-document": "This document has not been saved yet.",
};

export function registerCopyFileDirectory(): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage("Open a file first.");
      return;
    }

    // Resolves the right root in a multi-root workspace, and is undefined for a
    // file opened from outside it.
    const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);

    const result = getFileDirectory(editor.document.uri, folder?.uri.fsPath);

    if (!result.ok) {
      vscode.window.showErrorMessage(failureMessages[result.reason]);
      return;
    }

    await copyToClipboard(result.value);
  });
}
