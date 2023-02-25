import * as vscode from 'vscode';
import { process_capture } from '../utils/process_capture';
import { parse_python_message } from '../python_message';
import { logPythonException } from '../utils/logging';

const SHOW_OUTPUT_CONSOLE_ACTION = 'Show output console';

class SurfaceDocument implements vscode.CustomDocument {
    uri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
    }

    async viewImage(webviewPanel: vscode.WebviewPanel): Promise<void> {

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
        else if (msg.status === 'ERROR') {
            logPythonException(msg.content);
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
    async resolveCustomEditor(document: SurfaceDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
        console.log('resolve');
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        await document.viewImage(webviewPanel);
    }

    register(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider('nisight.surfaceviewer', this)
        );
    }
}