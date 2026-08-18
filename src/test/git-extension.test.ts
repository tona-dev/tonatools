import * as assert from "assert";
import { checkGitEnabled, getGitApi } from "../core/repositories/git-extension";

suite("Git extension wiring", () => {
  test("git API is reachable", () => {
    assert.strictEqual(checkGitEnabled(), true);

    const api = getGitApi();
    assert.ok(api, "expected the git API to be available");
    assert.ok(Array.isArray(api.repositories));
  });
});
