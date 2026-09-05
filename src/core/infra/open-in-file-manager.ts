import * as vscode from "vscode";

/**
 * Opens a directory in the OS file manager
 * (Finder on macOS, Nautilus on Linux, File Explorer on Windows),
 * displaying the inside contents of the directory.
 */
export async function openInFileManager(targetFsPath: string): Promise<boolean> {
  const uri = vscode.Uri.file(targetFsPath);
  return await vscode.env.openExternal(uri);
}
