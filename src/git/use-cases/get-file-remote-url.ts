import type { Uri } from "vscode";
import type { UseCaseResult } from "../../core/domain/UseCaseResult";
import type {
  API as GitApi,
  Remote,
  Repository,
} from "../../core/repositories/git";
import {
  buildFileUrl,
  parseRemoteUrl,
  toRepoRelativePath,
  type LineRange,
  type RemoteTemplate,
} from "../domain/RemoteUrl";

export type FileRemoteUrlFailure =
  | "no-repository"
  | "no-branch"
  | "no-remote"
  | "unsupported-remote"
  | "file-outside-repository";

export type FileRemoteUrlResult = UseCaseResult<string, FileRemoteUrlFailure>;

export function getFileRemoteUrl(
  api: GitApi,
  file: Uri,
  lines: LineRange | undefined,
  templates: Readonly<Record<string, Partial<RemoteTemplate>>>,
): FileRemoteUrlResult {
  const repository = api.getRepository(file);

  if (!repository) {
    return { ok: false, reason: "no-repository" };
  }

  const head = repository.state.HEAD;
  const branch = head?.name;

  // Undefined on a detached HEAD, where there is no branch to link to.
  if (!branch) {
    return { ok: false, reason: "no-branch" };
  }

  const remote = pickRemote(repository, head?.upstream?.remote);

  if (!remote) {
    return { ok: false, reason: "no-remote" };
  }

  // pushUrl first: with a fork setup it is the one the branch actually lives on.
  const remoteUrl = remote.pushUrl ?? remote.fetchUrl;
  const location = remoteUrl ? parseRemoteUrl(remoteUrl) : undefined;

  if (!location) {
    return { ok: false, reason: "unsupported-remote" };
  }

  const relativePath = toRepoRelativePath(
    repository.rootUri.fsPath,
    file.fsPath,
  );

  if (!relativePath) {
    return { ok: false, reason: "file-outside-repository" };
  }

  return {
    ok: true,
    value: buildFileUrl(
      location,
      { branch, file: relativePath, lines },
      templates,
    ),
  };
}

/** The branch's own upstream, else `origin`, else whatever is configured. */
function pickRemote(
  repository: Repository,
  upstreamRemote: string | undefined,
): Remote | undefined {
  const remotes = repository.state.remotes;

  if (upstreamRemote) {
    const upstream = remotes.find((remote) => remote.name === upstreamRemote);

    if (upstream) {
      return upstream;
    }
  }

  return remotes.find((remote) => remote.name === "origin") ?? remotes[0];
}
