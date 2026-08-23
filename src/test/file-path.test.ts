import * as assert from "assert";
import { toRelativePath } from "../core/domain/FilePath";

suite("toRelativePath", () => {
  const root = "/Users/martiuh/tonadevsantos/tonatools";

  test("returns a forward-slash path for a nested target", () => {
    assert.strictEqual(
      toRelativePath(root, `${root}/src/git/domain/RemoteUrl.ts`),
      "src/git/domain/RemoteUrl.ts",
    );
  });

  test("handles a target directly at the root", () => {
    assert.strictEqual(toRelativePath(root, `${root}/package.json`), "package.json");
  });

  test("returns an empty string when the target is the root", () => {
    // Callers decide what this means: nonsense for a file, normal for a directory.
    assert.strictEqual(toRelativePath(root, root), "");
  });

  test("declines a target outside the root", () => {
    assert.strictEqual(
      toRelativePath(root, "/Users/martiuh/elsewhere/notes.md"),
      undefined,
    );
  });
});
