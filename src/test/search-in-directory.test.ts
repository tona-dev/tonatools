import * as assert from "assert";
import * as vscode from "vscode";
import {
  toAncestorDirectories,
  toFilesToInclude,
} from "../search/domain/SearchScope";
import { getSearchDirectories } from "../search/use-cases/get-search-directories";

const root = "/Users/martiuh/tonadevsantos/tonatools";

suite("toAncestorDirectories", () => {
  test("lists a nested directory and its parents, nearest first", () => {
    assert.deepStrictEqual(
      toAncestorDirectories("src/storybook-supports/person/me"),
      [
        "src/storybook-supports/person/me",
        "src/storybook-supports/person",
        "src/storybook-supports",
        "src",
      ],
    );
  });

  test("returns a single top-level directory as is", () => {
    assert.deepStrictEqual(toAncestorDirectories("src"), ["src"]);
  });

  test("returns nothing for the workspace root", () => {
    assert.deepStrictEqual(toAncestorDirectories(""), []);
    assert.deepStrictEqual(toAncestorDirectories("."), []);
  });
});

suite("toFilesToInclude", () => {
  test("prefixes ./ in a single-root workspace", () => {
    assert.strictEqual(toFilesToInclude("src/search"), "./src/search");
  });

  test("leads with the folder name in a multi-root workspace", () => {
    assert.strictEqual(
      toFilesToInclude("src/search", "tonatools"),
      "./tonatools/src/search",
    );
  });
});

suite("getSearchDirectories", () => {
  test("lists the file's directory and its parents", () => {
    const result = getSearchDirectories(
      vscode.Uri.file(`${root}/src/search/domain/SearchScope.ts`),
      root,
    );

    assert.ok(result.ok, "expected a nested file to succeed");
    assert.deepStrictEqual(result.value, [
      "src/search/domain",
      "src/search",
      "src",
    ]);
  });

  test("declines a file at the workspace root", () => {
    const result = getSearchDirectories(
      vscode.Uri.file(`${root}/package.json`),
      root,
    );

    assert.ok(!result.ok, "expected a root-level file to fail");
    assert.strictEqual(result.reason, "workspace-root");
  });

  test("declines a file outside the workspace", () => {
    const result = getSearchDirectories(
      vscode.Uri.file("/Users/martiuh/elsewhere/notes.md"),
      root,
    );

    assert.ok(!result.ok, "expected an outside file to fail");
    assert.strictEqual(result.reason, "outside-workspace");
  });

  test("declines when there is no workspace folder", () => {
    const result = getSearchDirectories(
      vscode.Uri.file(`${root}/src/extension.ts`),
      undefined,
    );

    assert.ok(!result.ok, "expected no workspace folder to fail");
    assert.strictEqual(result.reason, "outside-workspace");
  });

  test("declines an unsaved buffer", () => {
    const result = getSearchDirectories(
      vscode.Uri.parse("untitled:Untitled-1"),
      root,
    );

    assert.ok(!result.ok, "expected an untitled buffer to fail");
    assert.strictEqual(result.reason, "untitled-document");
  });
});
