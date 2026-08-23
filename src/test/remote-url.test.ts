import * as assert from "assert";
import { buildFileUrl, parseRemoteUrl } from "../git/domain/RemoteUrl";

suite("parseRemoteUrl", () => {
  test("reads scp-like ssh remotes", () => {
    assert.deepStrictEqual(parseRemoteUrl("git@github.com:martiuh/tonatools.git"), {
      host: "github.com",
      path: "martiuh/tonatools",
    });
  });

  test("reads https remotes, with or without .git", () => {
    const expected = { host: "github.com", path: "martiuh/tonatools" };

    assert.deepStrictEqual(
      parseRemoteUrl("https://github.com/martiuh/tonatools.git"),
      expected,
    );
    assert.deepStrictEqual(
      parseRemoteUrl("https://github.com/martiuh/tonatools"),
      expected,
    );
  });

  test("drops userinfo and ssh port", () => {
    assert.deepStrictEqual(
      parseRemoteUrl("ssh://git@git.example.com:2222/group/sub/repo.git"),
      { host: "git.example.com", path: "group/sub/repo" },
    );
  });

  test("lowercases the host but leaves the path alone", () => {
    assert.deepStrictEqual(parseRemoteUrl("git@GitHub.com:Martiuh/TonaTools.git"), {
      host: "github.com",
      path: "Martiuh/TonaTools",
    });
  });

  test("declines local clones and junk", () => {
    assert.strictEqual(parseRemoteUrl(""), undefined);
    assert.strictEqual(parseRemoteUrl("   "), undefined);
    assert.strictEqual(parseRemoteUrl("/Users/martiuh/repo"), undefined);
    assert.strictEqual(parseRemoteUrl("file:///Users/martiuh/repo"), undefined);
    assert.strictEqual(parseRemoteUrl("https://github.com"), undefined);
  });
});

suite("buildFileUrl", () => {
  const github = { host: "github.com", path: "martiuh/tonatools" };
  const file = { branch: "main", file: "src/extension.ts" };

  test("uses the built-in file shape per host", () => {
    assert.strictEqual(
      buildFileUrl(github, file),
      "https://github.com/martiuh/tonatools/blob/main/src/extension.ts",
    );
    assert.strictEqual(
      buildFileUrl({ host: "gitlab.com", path: "group/repo" }, file),
      "https://gitlab.com/group/repo/-/blob/main/src/extension.ts",
    );
    assert.strictEqual(
      buildFileUrl({ host: "bitbucket.org", path: "team/repo" }, file),
      "https://bitbucket.org/team/repo/src/main/src/extension.ts",
    );
  });

  test("each host spells a line range its own way", () => {
    const lines = { start: 42, end: 51 };

    assert.strictEqual(
      buildFileUrl(github, { ...file, lines }),
      "https://github.com/martiuh/tonatools/blob/main/src/extension.ts#L42-L51",
    );
    assert.strictEqual(
      buildFileUrl({ host: "gitlab.com", path: "group/repo" }, { ...file, lines }),
      "https://gitlab.com/group/repo/-/blob/main/src/extension.ts#L42-51",
    );
    assert.strictEqual(
      buildFileUrl({ host: "bitbucket.org", path: "team/repo" }, { ...file, lines }),
      "https://bitbucket.org/team/repo/src/main/src/extension.ts#lines-42:51",
    );
  });

  test("a one-line range uses the single-line anchor", () => {
    assert.strictEqual(
      buildFileUrl(github, { ...file, lines: { start: 42, end: 42 } }),
      "https://github.com/martiuh/tonatools/blob/main/src/extension.ts#L42",
    );
    assert.strictEqual(
      buildFileUrl(
        { host: "bitbucket.org", path: "team/repo" },
        { ...file, lines: { start: 42, end: 42 } },
      ),
      "https://bitbucket.org/team/repo/src/main/src/extension.ts#lines-42",
    );
  });

  test("omitting lines links the whole file", () => {
    assert.strictEqual(
      buildFileUrl(github, file),
      "https://github.com/martiuh/tonatools/blob/main/src/extension.ts",
    );
  });

  test("falls back to the github shape for unknown hosts", () => {
    assert.strictEqual(
      buildFileUrl({ host: "git.example.com", path: "group/repo" }, file),
      "https://git.example.com/group/repo/blob/main/src/extension.ts",
    );
  });

  test("overriding file only still inherits that host's line anchors", () => {
    assert.strictEqual(
      buildFileUrl(
        { host: "gitlab.com", path: "group/repo" },
        { ...file, lines: { start: 42, end: 51 } },
        { "gitlab.com": { file: "https://mirror.internal/${path}/${branch}/${file}" } },
      ),
      "https://mirror.internal/group/repo/main/src/extension.ts#L42-51",
    );
  });

  test("a user template covers a self-hosted instance", () => {
    assert.strictEqual(
      buildFileUrl(
        { host: "git.example.com", path: "group/repo" },
        { ...file, lines: { start: 42, end: 51 } },
        {
          "git.example.com": {
            file: "https://${host}/${path}/-/blob/${branch}/${file}",
            lineRange: "#L${start}-${end}",
          },
        },
      ),
      "https://git.example.com/group/repo/-/blob/main/src/extension.ts#L42-51",
    );
  });

  test("the * template replaces the fallback but not a built-in host", () => {
    const templates = {
      "*": { file: "https://${host}/${path}/browse/${branch}/${file}" },
    };

    assert.strictEqual(
      buildFileUrl({ host: "git.example.com", path: "group/repo" }, file, templates),
      "https://git.example.com/group/repo/browse/main/src/extension.ts",
    );
    assert.strictEqual(
      buildFileUrl(github, file, templates),
      "https://github.com/martiuh/tonatools/blob/main/src/extension.ts",
    );
  });

  test("escapes the path but keeps slashes, in both branch and file", () => {
    assert.strictEqual(
      buildFileUrl(github, { branch: "feature/git-slice", file: "src/my file.ts" }),
      "https://github.com/martiuh/tonatools/blob/feature/git-slice/src/my%20file.ts",
    );
    assert.strictEqual(
      buildFileUrl(github, { branch: "main", file: "docs/a#b.md" }),
      "https://github.com/martiuh/tonatools/blob/main/docs/a%23b.md",
    );
  });
});
