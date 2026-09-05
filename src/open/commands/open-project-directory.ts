import * as vscode from "vscode";
import { openInFileManager } from "../../core/infra/open-in-file-manager";
import { getGitApi } from "../../core/repositories/git-extension";
import {
  getProjectDirectoryToOpen,
  type ProjectDirectoryFailure,
} from "../use-cases/get-project-directory-to-open";

const commandId = "tonatools.open.projectdirectory";

const failureMessages: Readonly<Record<ProjectDirectoryFailure, string>> = {
  "no-workspace": "No workspace or project directory found.",
};

export function registerOpenProjectDirectory(): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async () => {
    const editor = vscode.window.activeTextEditor;
    const gitApi = getGitApi();
    const gitRepo = editor
      ? gitApi?.getRepository(editor.document.uri)
      : gitApi?.repositories[0];

    const result = getProjectDirectoryToOpen({
      activeFileUri: editor?.document.uri,
      workspaceFolders: vscode.workspace.workspaceFolders,
      gitRootUri: gitRepo?.rootUri,
    });

    if (!result.ok) {
      vscode.window.showErrorMessage(failureMessages[result.reason]);
      return;
    }

    await openInFileManager(result.value);
  });
}
