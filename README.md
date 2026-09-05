# tonatools

This is just a ton-a-tools for the anxious typer.

A set of Command Palette commands that get data out of the file you're already looking at.
Sometimes you are just too deep in the `cmd + p` flow and you need to get some data from the directory, file naem, location, share file in remote or something else. You
just wish you could `pwd`, `ls` the current file (actually I'm going to explore this idea). This is an effort to cater to those needs.

## Install

- **From the Marketplace:** search for **tonatools** in the Extensions view, or run
  `ext install tonadev.tonatools` in the Quick Open bar.
- **From a `.vsix`:** run `pnpm vsce package`, then **Extensions: Install from VSIX…**.

## Commands

| Command                                  | What it does                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `File: Copy current workspace directory` | Copies the active file's folder, relative to the workspace root — `src/git/commands`                                                                                                        |
| `File: Copy file name`                   | Copies the active file's name — `RemoteUrl.ts`                                                                                                                                              |
| `Git: Copy file location in remote url`  | Copies a link to the active file on its remote, on the branch you're on, anchored to your selection — `https://github.com/tona-dev/tonatools/blob/main/src/git/domain/RemoteUrl.ts#L42-L50` |
| `Open: Project directory`                | Opens the project or workspace directory in your system file manager (Finder on macOS, Nautilus on Linux, File Explorer on Windows)                                                         |
| `Open: File directory`                   | Opens the active file's folder in your system file manager (Finder on macOS, Nautilus on Linux, File Explorer on Windows)                                                                   |

These are palette-first — no shortcuts ship with the extension. If you reach for one often enough,
bind it yourself through **Preferences: Open Keyboard Shortcuts** and search for the command name.

## Settings

### `tonatools.git.remoteTemplates`

URL templates per git remote host, used by `Git: Copy file location in remote url`.

`github.com`, `gitlab.com` and `bitbucket.org` are built in, and any other host falls back to the
GitHub-shaped URL. Point this setting at your own hosts when that guess is wrong, like a
self-hosted GitLab:

```json
{
  "tonatools.git.remoteTemplates": {
    "git.example.com": {
      "file": "https://${host}/${path}/-/blob/${branch}/${file}",
      "lineRange": "#L${start}-${end}"
    }
  }
}
```

Each host maps to up to three keys:

| Key         | What it builds                  | Placeholders                                                     |
| ----------- | ------------------------------- | ---------------------------------------------------------------- |
| `file`      | The URL of the file itself      | `${host}`, `${path}` (e.g. `owner/repo`), `${branch}`, `${file}` |
| `line`      | The anchor for a single line    | `${start}`                                                       |
| `lineRange` | The anchor for a range of lines | `${start}`, `${end}`                                             |

Keys resolve one by one, most specific first: your entry for that host, then the built-in for that
host, then your `*` entry, then the default. So you only have to write the keys that differ — the
example above sets `file` and `lineRange`, and leaves `line` out because the default `#L${start}`
is already what GitLab wants.

Use `*` as the host to change what every unrecognised host gets.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

Thanks for checking out my first VS Code extension.
