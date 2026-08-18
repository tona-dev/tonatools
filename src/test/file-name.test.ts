import * as assert from "assert";
import * as vscode from "vscode";
import { toFileName } from "../filesystem/domain/FileName";
import { getFileName } from "../filesystem/use-cases/get-file-name";

suite("toFileName", () => {
  test("takes the last segment of a nested path", () => {
    assert.strictEqual(toFileName("/a/b/c.ts"), "c.ts");
  });

  test("handles a file at the root", () => {
    assert.strictEqual(toFileName("/c.ts"), "c.ts");
  });

  test("keeps a name with no extension", () => {
    assert.strictEqual(toFileName("/a/b/Makefile"), "Makefile");
  });

  test("keeps every dot in a multi-dot name", () => {
    assert.strictEqual(toFileName("/a/eslint.config.mjs"), "eslint.config.mjs");
    assert.strictEqual(toFileName("/a/.gitignore"), ".gitignore");
  });
});

suite("getFileName", () => {
  test("returns the name of a saved file", () => {
    const result = getFileName(vscode.Uri.file("/a/b/c.ts"));

    assert.ok(result.ok, "expected a saved file to succeed");
    assert.strictEqual(result.value, "c.ts");
  });

  test("declines an unsaved buffer rather than returning its label", () => {
    const result = getFileName(vscode.Uri.parse("untitled:Untitled-1"));

    assert.ok(!result.ok, "expected an untitled buffer to fail");
    assert.strictEqual(result.reason, "untitled-document");
  });
});
