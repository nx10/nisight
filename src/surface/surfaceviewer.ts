import * as vscode from 'vscode';
import * as child from 'child_process';

const SHOW_OUTPUT_CONSOLE_ACTION = 'Show output console';

class SurfaceDocument implements vscode.CustomDocument {
    uri: vscode.Uri;
    outputConsole: vscode.OutputChannel;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
        this.outputConsole = vscode.window.createOutputChannel("NiSight");
    }

    viewImage(webviewPanel: vscode.WebviewPanel): void {

        webviewPanel.webview.html = 'Loading preview...';
        
        const config = vscode.workspace.getConfiguration('nisight');
        const pythonInterpreter = config.get<string>('pythonInterpreter', 'python');
		const pythonProcess = child.spawn(pythonInterpreter, [__dirname + '/../src/python/nisight.py', '--type', 'surf', '--file', this.uri.fsPath]);

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
                vscode.window.showErrorMessage(`NiSight: Error ${obj.content.exception} occured.`, SHOW_OUTPUT_CONSOLE_ACTION).then(choice => {
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

export class SurfaceViewer implements vscode.CustomReadonlyEditorProvider<SurfaceDocument> {
    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): SurfaceDocument | Thenable<SurfaceDocument> {
        console.log(uri);
        return new SurfaceDocument(uri);
    }
    resolveCustomEditor(document: SurfaceDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        console.log('resolve');
        webviewPanel.webview.options = {
			enableScripts: true,
		};
        document.viewImage(webviewPanel);
    }
}