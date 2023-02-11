import * as vscode from 'vscode';
import * as child from 'child_process';

class VoxelDocument implements vscode.CustomDocument {
    uri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
    }

    viewImage(webviewPanel: vscode.WebviewPanel): void {

        webviewPanel.webview.html = `Loading preview...`;
        
		const pythonProcess = child.spawn('python', [__dirname + '\\..\\src\\python\\nisight.py', "--type", "img", "--file", this.uri.fsPath]);

		pythonProcess.stdout.on('data', (data) => {
            try {
                const obj = JSON.parse(data);
                webviewPanel.webview.html = obj['html'];
            } catch (error) {
                console.log(error);
            }
		});

		pythonProcess.stderr.on('data', (data) => {
		    console.error(`Error from Python script: ${data}`);
		});

		pythonProcess.on('close', (code) => {
		    console.log(`Python script exited with code ${code}`);
		});
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