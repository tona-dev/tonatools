import * as vscode from "vscode";
import { toFilesToInclude } from "../domain/SearchScope";
import {
  getSearchDirectories,
  type SearchDirectoriesFailure,
} from "../use-cases/get-search-directories";

const commandId = "tonatools.search.indirectory";

const failureMessages: Readonly<Record<SearchDirectoriesFailure, string>> = {
  "untitled-document": "This document has not been saved yet.",
  "outside-workspace": "This file is outside the workspace, so Search can't scope to it.",
  "workspace-root": "This file sits at the workspace root — use the regular Search.",
};

interface DirectoryItem extends vscode.QuickPickItem {
  readonly directory: string;
}

export function registerSearchInDirectory(): vscode.Disposable {
  return vscode.commands.registerCommand(commandId, async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage("Open a file first.");
      return;
    }

    const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);

    const result = getSearchDirectories(editor.document.uri, folder?.uri.fsPath);

    if (!result.ok) {
      vscode.window.showErrorMessage(failureMessages[result.reason]);
      return;
    }

    const items: DirectoryItem[] = result.value.map((directory, index) =>
      index === 0
        ? { label: "This directory", description: directory, directory }
        : { label: directory, directory },
    );

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: "Search in directory",
    });

    if (!picked) {
      return;
    }

    // Only a multi-root workspace needs the folder name to disambiguate.
    const isMultiRoot = (vscode.workspace.workspaceFolders?.length ?? 0) > 1;

    await vscode.commands.executeCommand("workbench.action.findInFiles", {
      filesToInclude: toFilesToInclude(
        picked.directory,
        isMultiRoot ? folder?.name : undefined,
      ),
      triggerSearch: true,
    });
  });
}
