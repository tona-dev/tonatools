import * as vscode from "vscode";

/** Writes to the clipboard and confirms it, so every command says it the same way. */
export async function copyToClipboard(value: string): Promise<void> {
  await vscode.env.clipboard.writeText(value);

  vscode.window.showInformationMessage(`Copied ${value} to the clipboard`);
}
