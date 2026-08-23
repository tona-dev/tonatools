/**
 * Pure remote-URL logic. Deliberately free of any `vscode` import so it can be
 * unit tested on its own.
 */

export interface RemoteLocation {
  /** Lowercased hostname, without userinfo or port. */
  readonly host: string;
  /** Repository path, e.g. `martiuh/tonatools`. No leading slash, no `.git`. */
  readonly path: string;
}

export interface LineRange {
  /** 1-based, inclusive. */
  readonly start: number;
  /** 1-based, inclusive. Equal to `start` for a single line. */
  readonly end: number;
}

export interface FileLocation {
  readonly branch: string;
  /** Repo-relative, forward slashes. */
  readonly file: string;
  /** Omit to link the whole file. */
  readonly lines?: LineRange;
}

export interface RemoteTemplate {
  /** Placeholders: `${host}`, `${path}`, `${branch}`, `${file}`. */
  readonly file: string;
  /** Anchor for one line. Placeholder: `${start}`. */
  readonly line: string;
  /** Anchor for a range. Placeholders: `${start}`, `${end}`. */
  readonly lineRange: string;
}

/**
 * Every host spells the file path and the line anchor differently, which is why
 * a template is an object rather than a single string. Built-ins go through the
 * same substitution as user-supplied templates — one code path to reason about.
 */
const defaultRemoteTemplates: Readonly<Record<string, RemoteTemplate>> = {
  "github.com": {
    file: "https://${host}/${path}/blob/${branch}/${file}",
    line: "#L${start}",
    lineRange: "#L${start}-L${end}",
  },
  "gitlab.com": {
    file: "https://${host}/${path}/-/blob/${branch}/${file}",
    line: "#L${start}",
    lineRange: "#L${start}-${end}",
  },
  "bitbucket.org": {
    file: "https://${host}/${path}/src/${branch}/${file}",
    line: "#lines-${start}",
    lineRange: "#lines-${start}:${end}",
  },
};

/** Used for hosts with no built-in and no user-supplied template. */
const fallbackRemoteTemplate: RemoteTemplate = {
  file: "https://${host}/${path}/blob/${branch}/${file}",
  line: "#L${start}",
  lineRange: "#L${start}-L${end}",
};

const schemePattern = /^[a-z][a-z0-9+.-]*:\/\//i;
const scpLikePattern = /^(?:[^@/]+@)?([^@:/]+):(.+)$/;

/**
 * Parses the URL forms git actually stores in `remote.<name>.url`: scp-like
 * (`git@host:owner/repo.git`), and any `ssh://`, `https://` or `git://` URL.
 * Returns undefined for local paths and anything without a usable host.
 */
export function parseRemoteUrl(remoteUrl: string): RemoteLocation | undefined {
  const trimmed = remoteUrl.trim();

  if (trimmed === "") {
    return undefined;
  }

  if (schemePattern.test(trimmed)) {
    let parsed: URL;

    try {
      parsed = new URL(trimmed);
    } catch {
      return undefined;
    }

    // A file: URL is a local clone — there is nothing to browse to. The port is
    // dropped on purpose: an SSH port says nothing about the web frontend.
    if (parsed.protocol === "file:") {
      return undefined;
    }

    return toRemoteLocation(parsed.hostname, parsed.pathname);
  }

  const scpLike = scpLikePattern.exec(trimmed);

  if (scpLike) {
    return toRemoteLocation(scpLike[1], scpLike[2]);
  }

  return undefined;
}

/**
 * Builds the browsable URL for a file, optionally anchored at `file.lines`.
 * `templates` are the user's overrides, keyed by host; the `*` key overrides the
 * fallback for unrecognised hosts.
 *
 * Resolution happens per key, not per host, so overriding `file` for a
 * self-hosted instance still inherits that host's `line` and `lineRange`.
 * Order, most specific first: user template for this host, built-in template for
 * this host, user `*` template, built-in fallback.
 */
export function buildFileUrl(
  location: RemoteLocation,
  file: FileLocation,
  templates: Readonly<Record<string, Partial<RemoteTemplate>>> = {},
): string {
  const template = resolveTemplate(location.host, templates);
  const anchor = buildAnchor(template, file.lines);

  return (template.file + anchor)
    .replaceAll("${host}", location.host)
    .replaceAll("${path}", location.path)
    .replaceAll("${branch}", encodePathSegments(file.branch))
    .replaceAll("${file}", encodePathSegments(file.file));
}

function resolveTemplate(
  host: string,
  templates: Readonly<Record<string, Partial<RemoteTemplate>>>,
): RemoteTemplate {
  const forHost = templates[host] ?? {};
  const builtIn = defaultRemoteTemplates[host] ?? {};
  const wildcard = templates["*"] ?? {};

  return {
    file:
      forHost.file ??
      builtIn.file ??
      wildcard.file ??
      fallbackRemoteTemplate.file,
    line:
      forHost.line ??
      builtIn.line ??
      wildcard.line ??
      fallbackRemoteTemplate.line,
    lineRange:
      forHost.lineRange ??
      builtIn.lineRange ??
      wildcard.lineRange ??
      fallbackRemoteTemplate.lineRange,
  };
}

function buildAnchor(
  template: RemoteTemplate,
  lines: LineRange | undefined,
): string {
  if (!lines) {
    return "";
  }

  if (lines.start === lines.end) {
    return template.line.replaceAll("${start}", String(lines.start));
  }

  return template.lineRange
    .replaceAll("${start}", String(lines.start))
    .replaceAll("${end}", String(lines.end));
}

function toRemoteLocation(
  host: string,
  rawPath: string,
): RemoteLocation | undefined {
  const repoPath = rawPath
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "");

  if (host === "" || repoPath === "") {
    return undefined;
  }

  return { host: host.toLowerCase(), path: repoPath };
}

/**
 * Branch names (`feature/git-slice`) and file paths both contain `/`, which must
 * survive as a path separator — every host expects it verbatim. The rest is
 * escaped, so spaces and `#` in a filename cannot break the URL.
 */
function encodePathSegments(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}
