import * as vscode from 'vscode';
import * as child from 'child_process';

import { process_capture } from '../utils/process_capture';
import { parse_python_message } from '../python_message';
import { logPythonException } from '../utils/logging';


class VoxelDocument implements vscode.CustomDocument {
    uri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
    }

    async viewImage(webviewPanel: vscode.WebviewPanel): Promise<void> {

        webviewPanel.webview.html = 'Loading preview...';

        const config = vscode.workspace.getConfiguration('nisight');
        const pythonInterpreter = config.get<string>('pythonInterpreter', 'python');

        const processOutput = await process_capture(pythonInterpreter, [__dirname + '/../src/python/nisight.py', '--type', 'img', '--file', this.uri.fsPath]);

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

export class VoxelViewer implements vscode.CustomReadonlyEditorProvider<VoxelDocument> {
    private document?: VoxelDocument;
    private webviewPanel?: vscode.WebviewPanel;

    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): VoxelDocument | Thenable<VoxelDocument> {
        console.log(uri);
        this.document = new VoxelDocument(uri);
        return this.document;
    }
    resolveCustomEditor(document: VoxelDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        console.log('resolve');
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        document.viewImage(webviewPanel);
        this.webviewPanel = webviewPanel;
    }

    register(context: vscode.ExtensionContext) {
        const voxelDisposable = vscode.window.registerCustomEditorProvider('nisight.voxelviewer', this);
        context.subscriptions.push(voxelDisposable);

        context.subscriptions.push(
            vscode.commands.registerCommand('nisight.voxelviewer.refresh', () => {
                if (this.webviewPanel) { this.document?.viewImage(this.webviewPanel); }
            })
        );
    }
}