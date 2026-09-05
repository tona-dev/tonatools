import * as vscode from "vscode";
import { openInFileManager } from "../../core/infra/open-in-file-manager";
import {
  getFileDirectoryToOpen,
  type FileDirectoryToOpenFailure,
} from "../use-cases/get-file-directory-to-open";

const commandId = "tonatools.open.filedirectory";

const failureMessages: Readonly<Record<FileDirectoryToOpenFailure, string>> = {
  "untitled-document": "This document has not been saved yet.",
};

export function registerOpenFileDirectory(): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage("Open a file first.");
      return;
    }

    const result = getFileDirectoryToOpen(editor.document.uri);

    if (!result.ok) {
      vscode.window.showErrorMessage(failureMessages[result.reason]);
      return;
    }

    await openInFileManager(result.value);
  });
}
