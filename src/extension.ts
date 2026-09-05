import * as vscode from "vscode";
import { registerCopyFileDirectory } from "./filesystem/commands/copy-file-directory";
import { registerCopyFileName } from "./filesystem/commands/copy-file-name";
import { registerCopyFileRemoteUrl } from "./git/commands/copy-file-remote-url";
import { registerOpenFileDirectory } from "./open/commands/open-file-directory";
import { registerOpenProjectDirectory } from "./open/commands/open-project-directory";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(registerCopyFileName());
  context.subscriptions.push(registerCopyFileDirectory());
  context.subscriptions.push(registerCopyFileRemoteUrl());
  context.subscriptions.push(registerOpenProjectDirectory());
  context.subscriptions.push(registerOpenFileDirectory());
}

export function deactivate() {}
