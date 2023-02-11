import * as vscode from 'vscode'

class VoxelDocument implements vscode.CustomDocument {
    uri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
    }

    dispose(): void {
        throw new Error('Method not implemented.');
    }
    
}

export class VoxelViewer implements vscode.CustomReadonlyEditorProvider {
    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
        console.log(uri);
        return new VoxelDocument(uri);
    }
    resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        console.log("resolve");
    }
    
}