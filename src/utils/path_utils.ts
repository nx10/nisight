import * as vscode from "vscode";

export function windowsCompatiblePath(path: string): string {
    if (process.platform === "win32") {
        // Strip leading forward slashes
        return path.replace(/^\/+/, "");
    }

    return path;
}

export function getUri(extensionUri: vscode.Uri, pathList: string[]) {
    return vscode.Uri.joinPath(extensionUri, ...pathList);
}

export function getWebviewUri(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    pathList: string[]
) {
    return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}
