import * as vscode from 'vscode';
import * as child from 'child_process';

const PYTHON_INTERPRETER = 'python';
const SHOW_OUTPUT_CONSOLE_ACTION = 'Show output console';

class VoxelDocument implements vscode.CustomDocument {
    uri: vscode.Uri;
    outputConsole: vscode.OutputChannel;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
        this.outputConsole = vscode.window.createOutputChannel("NiSight");
    }

    viewImage(webviewPanel: vscode.WebviewPanel): void {

        webviewPanel.webview.html = 'Loading preview...';
        
		const pythonProcess = child.spawn(PYTHON_INTERPRETER, [__dirname + '/../src/python/nisight.py', '--type', 'img', '--file', this.uri.fsPath]);

        let bufferOut = '';

		pythonProcess.stdout.on('data', (data) => {
            bufferOut += data;
		});

		pythonProcess.on('close', (code) => {
            let obj;
            try {
                obj = JSON.parse(bufferOut);
            } catch (error) {
                console.error(error);
                return;
            }

            if (obj.status === 'OK') {
                webviewPanel.webview.html = obj['content'];
            }
            else if (obj.status === 'ERROR') {
                this.outputConsole.append(obj.content);
                vscode.window.showErrorMessage(`Error ${obj.content.exception} occured.`, SHOW_OUTPUT_CONSOLE_ACTION).then(choice => {
                    if (choice === SHOW_OUTPUT_CONSOLE_ACTION) {
                        this.outputConsole.show();
                    }
                });
            }
            else {
                console.error('Unknown status');
            }
		});
    }

    dispose(): void {
        console.log('dispose doc: ' + this.uri.toString());
    }
}

export class VoxelViewer implements vscode.CustomReadonlyEditorProvider<VoxelDocument> {
    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): VoxelDocument | Thenable<VoxelDocument> {
        console.log(uri);
        return new VoxelDocument(uri);
    }
    resolveCustomEditor(document: VoxelDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        console.log('resolve');
        webviewPanel.webview.options = {
			enableScripts: true,
		};
        document.viewImage(webviewPanel);
    }
}