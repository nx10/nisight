import * as vscode from 'vscode';
import { process_capture } from '../utils/process_capture';
import { parse_python_message } from '../python_message';

const SHOW_OUTPUT_CONSOLE_ACTION = 'Show output console';

class SurfaceDocument implements vscode.CustomDocument {
    uri: vscode.Uri;
    outputConsole: vscode.OutputChannel;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
        this.outputConsole = vscode.window.createOutputChannel("NiSight");
    }

    async viewImage(webviewPanel: vscode.WebviewPanel): Promise<void> {

        webviewPanel.webview.html = 'Loading preview...';

        const config = vscode.workspace.getConfiguration('nisight');
        const pythonInterpreter = config.get<string>('pythonInterpreter', 'python');

        const processOutput = await process_capture(pythonInterpreter, [__dirname + '/../src/python/nisight.py', '--type', 'surf', '--file', this.uri.fsPath]);

        let msg;
        try {
            msg = parse_python_message(processOutput.message);
        } catch (error) {
            console.error(error);
            return;
        }

        if (msg.status === 'OK') {
            webviewPanel.webview.html = msg.content as string;
        }
        else {
            this.outputConsole.append(msg.content.toString());
            vscode.window.showErrorMessage(`NiSight: Error ${msg.content.exception} occured.`, SHOW_OUTPUT_CONSOLE_ACTION).then(choice => {
                if (choice === SHOW_OUTPUT_CONSOLE_ACTION) {
                    this.outputConsole.show();
                }
            });
        }
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

    register(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider('nisight.surfaceviewer', this)
        );
    }
}