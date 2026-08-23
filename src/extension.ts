import * as vscode from "vscode";
import { registerCopyFileDirectory } from "./filesystem/commands/copy-file-directory";
import { registerCopyFileName } from "./filesystem/commands/copy-file-name";
import { registerCopyFileRemoteUrl } from "./git/commands/copy-file-remote-url";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(registerCopyFileName());
  context.subscriptions.push(registerCopyFileDirectory());
  context.subscriptions.push(registerCopyFileRemoteUrl());
}

export function deactivate() {}
