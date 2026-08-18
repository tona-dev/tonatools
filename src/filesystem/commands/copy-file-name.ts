import * as vscode from "vscode";
import { copyToClipboard } from "../../core/infra/copy-to-clipboard";
import {
  getFileName,
  type FileNameFailure,
} from "../use-cases/get-file-name";

const commandId = "tonatools.filesystem.cfn";

const failureMessages: Readonly<Record<FileNameFailure, string>> = {
  "untitled-document": "This document has not been saved yet.",
};

export function registerCopyFileName(): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage("Open a file first.");
      return;
    }

    const result = getFileName(editor.document.uri);

    if (!result.ok) {
      vscode.window.showErrorMessage(failureMessages[result.reason]);
      return;
    }

    await copyToClipboard(result.value);
  });
}
