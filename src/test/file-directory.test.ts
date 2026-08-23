import * as assert from "assert";
import * as vscode from "vscode";
import { toDirectory } from "../filesystem/domain/Directory";
import { getFileDirectory } from "../filesystem/use-cases/get-file-directory";

const root = "/Users/martiuh/tonadevsantos/tonatools";

suite("toDirectory", () => {
  test("drops the last segment of a nested path", () => {
    assert.strictEqual(toDirectory("/a/b/c.ts"), "/a/b");
  });

  test("handles a file at the root", () => {
    assert.strictEqual(toDirectory("/c.ts"), "/");
  });
});

suite("getFileDirectory", () => {
  test("returns the workspace-relative directory of a nested file", () => {
    const result = getFileDirectory(
      vscode.Uri.file(`${root}/src/filesystem/domain/Directory.ts`),
      root,
    );

    assert.ok(result.ok, "expected a nested file to succeed");
    assert.strictEqual(result.value, "src/filesystem/domain");
  });

  test("returns '.' for a file sitting at the workspace root", () => {
    const result = getFileDirectory(vscode.Uri.file(`${root}/package.json`), root);

    assert.ok(result.ok, "expected a root-level file to succeed");
    assert.strictEqual(result.value, ".");
  });

  test("falls back to the absolute directory with no workspace folder", () => {
    const result = getFileDirectory(
      vscode.Uri.file(`${root}/src/extension.ts`),
      undefined,
    );

    assert.ok(result.ok, "expected the fallback to succeed");
    assert.strictEqual(result.value, `${root}/src`);
  });

  test("falls back to the absolute directory for a file outside the workspace", () => {
    const result = getFileDirectory(
      vscode.Uri.file("/Users/martiuh/elsewhere/notes.md"),
      root,
    );

    assert.ok(result.ok, "expected the fallback to succeed");
    assert.strictEqual(result.value, "/Users/martiuh/elsewhere");
  });

  test("declines an unsaved buffer", () => {
    const result = getFileDirectory(
      vscode.Uri.parse("untitled:Untitled-1"),
      root,
    );

    assert.ok(!result.ok, "expected an untitled buffer to fail");
    assert.strictEqual(result.reason, "untitled-document");
  });
});
