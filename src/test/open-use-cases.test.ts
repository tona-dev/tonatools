import * as assert from "assert";
import * as vscode from "vscode";
import { getFileDirectoryToOpen } from "../open/use-cases/get-file-directory-to-open";
import { getProjectDirectoryToOpen } from "../open/use-cases/get-project-directory-to-open";

const root = "/Users/martiuh/tonadevsantos/tonatools";

suite("getFileDirectoryToOpen", () => {
  test("returns directory for a valid file URI", () => {
    const result = getFileDirectoryToOpen(
      vscode.Uri.file(`${root}/src/open/commands/open-file-directory.ts`),
    );

    assert.ok(result.ok);
    assert.strictEqual(result.value, `${root}/src/open/commands`);
  });

  test("declines unsaved untitled document", () => {
    const result = getFileDirectoryToOpen(
      vscode.Uri.parse("untitled:Untitled-1"),
    );

    assert.ok(!result.ok);
    assert.strictEqual(result.reason, "untitled-document");
  });
});

suite("getProjectDirectoryToOpen", () => {
  test("matches active file to its workspace folder", () => {
    const result = getProjectDirectoryToOpen({
      activeFileUri: vscode.Uri.file(`${root}/src/extension.ts`),
      workspaceFolders: [{ uri: vscode.Uri.file(root) }],
    });

    assert.ok(result.ok);
    assert.strictEqual(result.value, root);
  });

  test("falls back to first workspace folder when active file is outside workspace", () => {
    const result = getProjectDirectoryToOpen({
      activeFileUri: vscode.Uri.file("/other/dir/file.ts"),
      workspaceFolders: [{ uri: vscode.Uri.file(root) }],
    });

    assert.ok(result.ok);
    assert.strictEqual(result.value, root);
  });

  test("falls back to git root when no workspace folders are open", () => {
    const result = getProjectDirectoryToOpen({
      activeFileUri: vscode.Uri.file(`${root}/src/extension.ts`),
      workspaceFolders: [],
      gitRootUri: vscode.Uri.file(root),
    });

    assert.ok(result.ok);
    assert.strictEqual(result.value, root);
  });

  test("declines when neither workspace folders nor git root are available", () => {
    const result = getProjectDirectoryToOpen({
      activeFileUri: undefined,
      workspaceFolders: [],
      gitRootUri: undefined,
    });

    assert.ok(!result.ok);
    assert.strictEqual(result.reason, "no-workspace");
  });
});
