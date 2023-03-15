import * as vscode from "vscode";

import { processCapture } from "../utils/process_capture";
import { parsePythonMessage } from "../python_message";
import { logPythonException } from "../utils/logging";
import { getVenvInterpreter } from "../utils/python_environment";
import { Uri } from "vscode";
import nisightpy from "../python/scripts/nisight.py";
import { getUri } from "../utils/path_utils";

class VoxelDocument implements vscode.CustomDocument {
    uri: vscode.Uri;
    private extensionUri: vscode.Uri;

    constructor(uri: vscode.Uri, extensionUri: vscode.Uri) {
        this.uri = uri;
        this.extensionUri = extensionUri;
    }

    async viewImage(webviewPanel: vscode.WebviewPanel): Promise<void> {
        const pythonInterpreter = getVenvInterpreter();
        if (pythonInterpreter === undefined) {
            vscode.window.showErrorMessage("Python environment not found.");
            return;
        }

        const pyPath = getUri(this.extensionUri, ["dist", nisightpy]).fsPath;
        const processOutput = await processCapture(pythonInterpreter, [
            pyPath,
            "view",
            "--type",
            "img",
            "--file",
            this.uri.fsPath,
        ]);

        if (processOutput.code !== 0) {

            try {
                const msg = parsePythonMessage(processOutput.message);
                if (msg.status === "ERROR") {
                    logPythonException(msg.content);
                }
            } catch (error) {
                console.error(
                    `Python process had non-zero exit code. Message body: '${processOutput.message}'`
                );
                console.error(error);
                return;
            }
            return;
        }

        let msg;
        try {
            msg = parsePythonMessage(processOutput.message);
        } catch (error) {
            console.error(error);
            return;
        }

        if (msg.status === "OK") {
            webviewPanel.webview.html = msg.content as string;
        } else if (msg.status === "ERROR") {
            logPythonException(msg.content);
        }
    }

    dispose(): void {
        console.log("dispose doc: " + this.uri.toString());
    }
}

export class VoxelViewer
    implements vscode.CustomReadonlyEditorProvider<VoxelDocument>
{
    private extensionUri?: vscode.Uri;
    private document?: VoxelDocument;
    private webviewPanel?: vscode.WebviewPanel;

    openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): VoxelDocument | Thenable<VoxelDocument> {
        console.log(uri);
        this.document = new VoxelDocument(uri, this.extensionUri as Uri);
        return this.document;
    }
    async resolveCustomEditor(
        document: VoxelDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        console.log("resolve");
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        await document.viewImage(webviewPanel);
        this.webviewPanel = webviewPanel;
    }

    register(context: vscode.ExtensionContext) {
        this.extensionUri = context.extensionUri;
        const voxelDisposable = vscode.window.registerCustomEditorProvider(
            "nisight.voxelviewer",
            this
        );
        context.subscriptions.push(voxelDisposable);

        context.subscriptions.push(
            vscode.commands.registerCommand(
                "nisight.voxelviewer.refresh",
                () => {
                    if (this.webviewPanel) {
                        this.webviewPanel.webview.html = "Refreshing...";
                        this.document?.viewImage(this.webviewPanel);
                    }
                }
            )
        );
    }
}
