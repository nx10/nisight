import * as vscode from 'vscode'

class VoxelDocument implements vscode.CustomDocument {
    uri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
    }

    viewImage(webviewPanel: vscode.WebviewPanel): void {
        // load html here
        webviewPanel.webview.html = `<h1>${this.uri}</h1>`
    }

    dispose(): void {
        console.log("dispose doc: " + this.uri.toString());
    }
    
}

export class VoxelViewer implements vscode.CustomReadonlyEditorProvider<VoxelDocument> {
    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): VoxelDocument | Thenable<VoxelDocument> {
        console.log(uri);
        return new VoxelDocument(uri);
    }
    resolveCustomEditor(document: VoxelDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        console.log("resolve");
        document.viewImage(webviewPanel);
    }
    
}