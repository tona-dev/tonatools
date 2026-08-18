import * as vscode from "vscode";
import type { API as GitApi, GitExtension } from "./git";

const GIT_EXTENSION_ID = "vscode.git";

/**
 * True when vscode.git is present AND the `git.enabled` setting is on.
 * The setting can be false even though extensionDependencies is satisfied,
 * in which case getAPI(1) throws.
 */
export function checkGitEnabled(): boolean {
  const extension =
    vscode.extensions.getExtension<GitExtension>(GIT_EXTENSION_ID);
  return extension?.exports.enabled ?? false;
}

/**
 * The Git extension API, or undefined when git is unavailable.
 * Safe to call synchronously: extensionDependencies guarantees vscode.git
 * has activated before us, so `exports` is already populated.
 */
export function getGitApi(): GitApi | undefined {
  const extension =
    vscode.extensions.getExtension<GitExtension>(GIT_EXTENSION_ID);
  if (!extension?.exports.enabled) {
    return undefined;
  }
  return extension.exports.getAPI(1);
}
