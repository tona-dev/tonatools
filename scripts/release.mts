/**
 * Local-only release: tag the current package.json version, push the tag, and
 * cut the matching GitHub release.
 *
 * Pushing the tag is what publishes — azure-pipelines.yml triggers on `v*` and
 * packages/publishes the .vsix to the VS Marketplace. A published version number
 * is burned permanently, so everything up to the push is a preflight check.
 *
 * This script never writes package.json or CHANGELOG.md; bumpy owns those.
 *
 *   pnpm bumpy add ...            during development
 *   pnpm bumpy version --commit   bumps package.json + CHANGELOG, commits
 *   git push
 *   pnpm release                  this script
 *
 * Flags: --dry-run, --yes, --skip-tests, --title "Human title"
 */

import { execFile as execFileCb, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const GH_USER = "tona-dev";
const REPO_NAME = "tonatools";
const REPO = `${GH_USER}/${REPO_NAME}`;
const BASE_BRANCH = "main"; // matches .bumpy/_config.json baseBranch

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const execFile = promisify(execFileCb);

/** Run a command, throwing with its stderr on a non-zero exit. */
async function run(command: string, args: string[]) {
  const { stdout } = await execFile(command, args, { cwd: ROOT });
  return stdout.trim();
}

/** Run a command, returning null instead of throwing. For existence probes. */
async function tryRun(command: string, args: string[]) {
  try {
    return await run(command, args);
  } catch {
    return null;
  }
}

/** Run a command with its output streamed to this terminal. */
function runInherit(command: string, args: string[]) {
  return new Promise<void>((done, fail) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit" });
    child.on("error", fail);
    child.on("close", (code) =>
      code === 0
        ? done()
        : fail(new Error(`${command} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

/** An expected failure — reported as a message, without a stack trace. */
class ReleaseError extends Error {}

function fail(message: string): never {
  throw new ReleaseError(message);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Pull one version's entry out of CHANGELOG.md.
 *
 * bumpy's default formatter writes:
 *
 *   ## 0.2.0
 *   <sub>2026-09-05</sub>
 *
 *   - *(minor)* Add `Open` commands ...
 *
 * The heading and the `<sub>` date are dropped the same way bumpy drops them for
 * its own releases; the date is already on the GitHub release. The optional
 * `[...]` around the version tolerates leftover Keep a Changelog headings.
 */
export function getChangelogSection(changelog: string, version: string) {
  const lines = changelog.split("\n");
  const heading = new RegExp(`^##\\s+\\[?${escapeRegExp(version)}\\]?\\b`);

  const start = lines.findIndex((line) => heading.test(line));
  if (start === -1) {
    fail(
      `CHANGELOG.md has no section for ${version}.\n` +
        `  Add a bump file with \`pnpm bumpy add\`, then run \`pnpm bumpy version --commit\`.`,
    );
  }

  const rest = lines.slice(start + 1);
  const next = rest.findIndex((line) => /^##\s/.test(line));
  const body = (next === -1 ? rest : rest.slice(0, next))
    .filter((line) => !/^<sub>.*<\/sub>\s*$/.test(line))
    .join("\n")
    .trim();

  if (!body) {
    fail(`CHANGELOG.md section for ${version} is empty — nothing to release.`);
  }

  return body;
}

function readVersion() {
  const raw = readFileSync(resolve(ROOT, "package.json"), "utf8");
  const { version } = JSON.parse(raw) as { version?: unknown };

  if (typeof version !== "string" || !/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(version)) {
    fail(`package.json has no usable version (got ${JSON.stringify(version)}).`);
  }

  return version;
}

async function checkGithubAccount() {
  if (!(await tryRun("gh", ["--version"]))) {
    fail(
      "gh CLI not found. Install it from https://cli.github.com and run `gh auth login`.",
    );
  }

  // --jq does the parsing and shape-checking; an unexpected shape yields "".
  const active = await tryRun("gh", [
    "auth",
    "status",
    "--json",
    "hosts",
    "--jq",
    '.hosts["github.com"][] | select(.active and .state == "success") | .login',
  ]);

  if (active !== GH_USER) {
    fail(
      `Releases must be cut as ${GH_USER}, but the active gh account is ${active || "none"}.\n` +
        `  Run \`gh auth switch --user ${GH_USER}\`.`,
    );
  }

  const canPush = await tryRun("gh", [
    "api",
    `repos/${REPO}`,
    "--jq",
    ".permissions.push",
  ]);

  if (canPush !== "true") {
    fail(`${GH_USER} cannot push to ${REPO}, so it cannot create a release there.`);
  }
}

async function checkWorkingTree() {
  // --porcelain covers modified, staged and untracked in one shot.
  const dirty = await run("git", ["status", "--porcelain"]);
  if (dirty) {
    // Re-indent rather than relying on run()'s trim, which eats the leading
    // space of the first status code and misaligns the list.
    const files = dirty
      .split("\n")
      .map((line) => `    ${line.trim()}`)
      .join("\n");
    fail(`Working tree is not clean — commit or stash before releasing:\n${files}`);
  }

  const branch = await run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch !== BASE_BRANCH) {
    fail(
      `Releases are cut from ${BASE_BRANCH}, but you are on ${branch}.\n` +
        `  Run \`git switch ${BASE_BRANCH}\`.`,
    );
  }

  await run("git", ["fetch", "origin", "--tags"]);

  const counts = await run("git", [
    "rev-list",
    "--left-right",
    "--count",
    `origin/${BASE_BRANCH}...HEAD`,
  ]);
  const [behind, ahead] = counts.split(/\s+/).map(Number);

  if (ahead > 0) {
    fail(
      `HEAD is ${ahead} commit(s) ahead of origin/${BASE_BRANCH}.\n` +
        `  The tag would point at a commit origin does not have — run \`git push\` first.`,
    );
  }
  if (behind > 0) {
    fail(
      `HEAD is ${behind} commit(s) behind origin/${BASE_BRANCH} — run \`git pull\` first.`,
    );
  }
}

type TagState = { exists: boolean };

/**
 * Decide what to do about the tag, so a rerun after a partial failure resumes
 * rather than wedging.
 */
async function checkTag(tag: string, head: string): Promise<TagState> {
  const local = await tryRun("git", ["rev-list", "-n", "1", tag]);

  // Both refspecs are needed: `refs/tags/<tag>` alone returns the tag *object*
  // for an annotated tag, not the commit. The `^{}` peeled ref is the commit,
  // and is absent for a lightweight tag — hence the fallback.
  const listing = await run("git", [
    "ls-remote",
    "--tags",
    "origin",
    `refs/tags/${tag}`,
    `refs/tags/${tag}^{}`,
  ]);
  const refs = new Map(
    listing
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [sha, ref] = line.split(/\s+/);
        return [ref, sha] as const;
      }),
  );
  const remote = refs.get(`refs/tags/${tag}^{}`) ?? refs.get(`refs/tags/${tag}`) ?? null;

  for (const [where, sha] of [
    ["locally", local],
    ["on origin", remote],
  ] as const) {
    if (sha && sha !== head) {
      fail(
        `Tag ${tag} already exists ${where} at ${sha.slice(0, 7)}, but HEAD is ${head.slice(0, 7)}.\n` +
          `  Refusing to move a published tag. Bump the version instead.`,
      );
    }
  }

  if (await tryRun("gh", ["release", "view", tag, "-R", REPO])) {
    fail(
      `${tag} has already been released — see https://github.com/${REPO}/releases/tag/${tag}`,
    );
  }

  return { exists: Boolean(local && remote) };
}

async function confirm(question: string) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const skipPrompt = args.includes("--yes");
  const skipTests = args.includes("--skip-tests");
  const humanTitle = args[args.indexOf("--title") + 1];

  const version = readVersion();
  const tag = `v${version}`;
  const title = args.includes("--title") && humanTitle ? `${tag} ${humanTitle}` : tag;
  const prerelease = version.includes("-");

  await checkGithubAccount();
  await checkWorkingTree();

  const head = await run("git", ["rev-parse", "HEAD"]);
  const { exists: tagPushed } = await checkTag(tag, head);

  const notes = getChangelogSection(
    readFileSync(resolve(ROOT, "CHANGELOG.md"), "utf8"),
    version,
  );

  console.log(`\n  ${title}${prerelease ? "  (prerelease)" : ""}`);
  console.log(`  ${REPO} @ ${head.slice(0, 7)}`);
  console.log(`  tag ${tag}${tagPushed ? " (already pushed — will only create the release)" : ""}`);
  console.log(`\n${notes.replace(/^/gm, "  ")}\n`);
  console.log(
    `  Pushing this tag triggers the Azure pipeline, which publishes ${version} to the`,
  );
  console.log(`  VS Marketplace. That version number cannot be reused.\n`);

  if (skipTests) {
    console.log("  ! Skipping tests (--skip-tests)\n");
  } else if (dryRun) {
    console.log("  Would run: pnpm test\n");
  } else {
    await runInherit("pnpm", ["test"]);
  }

  if (dryRun) {
    if (!tagPushed) {
      console.log(`  Would run: git tag -a ${tag} -m ${tag}`);
      console.log(`  Would run: git push origin refs/tags/${tag}`);
    }
    console.log(`  Would run: gh release create ${tag} -R ${REPO} --verify-tag ...`);
    console.log("\n  Dry run — nothing was changed.");
    return;
  }

  if (!skipPrompt && !(await confirm(`Release ${tag}?`))) {
    console.log("  Aborted.");
    return;
  }

  if (!tagPushed) {
    if (!(await tryRun("git", ["rev-list", "-n", "1", tag]))) {
      await run("git", ["tag", "-a", tag, "-m", tag]);
    }
    // The narrow refspec, so unrelated local tags never reach origin.
    await run("git", ["push", "origin", `refs/tags/${tag}`]);
    console.log(`  Pushed ${tag} — the Marketplace publish is now running.`);
  }

  // --verify-tag keeps git the source of truth: gh fails rather than creating a
  // tag of its own, so the Marketplace publish always fires from the real push.
  const url = await run("gh", [
    "release",
    "create",
    tag,
    "-R",
    REPO,
    "--verify-tag",
    "--title",
    title,
    "--notes",
    notes,
    ...(prerelease ? ["--prerelease"] : []),
  ]);

  console.log(`  Released ${url}`);
  console.log(
    `  Watch the publish: https://dev.azure.com (pipeline triggers on ${tag})`,
  );
}

// Guarded so the pure helpers above can be imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const message =
      error instanceof ReleaseError
        ? error.message
        : error instanceof Error
          ? (error.stack ?? error.message)
          : String(error);
    console.error(`\n  ${message.replace(/\n/g, "\n  ")}\n`);
    process.exitCode = 1;
  });
}
