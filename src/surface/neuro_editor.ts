import * as vscode from "vscode";
import {
    WebviewBackendMessage,
    WebviewFrontendMessage,
} from "./webview_message";
import { NeuroViewer } from "./neuro_viewer";

let COUNTER_VIEWER: number = 0;
let COUNTER_DOCUMENT: number = 0;

export class NeuroDocument implements vscode.CustomDocument {
    readonly editor: NeuroEditor;
    readonly uri: vscode.Uri;
    readonly viewer: NeuroViewer;

    webviewPanel?: vscode.WebviewPanel;
    private instanceId: number;

    private disposableWebPanelActivate?: vscode.Disposable;

    constructor(editor: NeuroEditor, uri: vscode.Uri) {
        this.editor = editor;
        this.uri = uri;
        this.viewer = new NeuroViewer(this);

        this.instanceId = COUNTER_DOCUMENT++;

        console.log("Created new doc #" + this.instanceId);
    }

    public async resolve(webviewPanel: vscode.WebviewPanel) {
        this.webviewPanel = webviewPanel;

        if (this.disposableWebPanelActivate) {
            this.disposableWebPanelActivate.dispose();
        }
        this.disposableWebPanelActivate = webviewPanel.onDidChangeViewState(
            (e) => {
                if (e.webviewPanel.visible && e.webviewPanel.active) {
                    this.editor.setActiveDocument(this);
                }
            }
        );

        await this.viewer.loadFile(this.uri);

        this.webviewPanel.webview.html = this.viewer.buildHtml();
        this.webviewPanel.webview.onDidReceiveMessage(
            (msg: WebviewFrontendMessage) =>
                this.viewer.handleWebviewMessage(msg)
        );
    }

    public sendWebviewMessage(message: WebviewBackendMessage) {
        if (!this.webviewPanel) {
            return;
        }
        return this.webviewPanel.webview.postMessage(message);
    }

    dispose(): void {
        console.log("dispose doc #" + this.instanceId);
        if (this.disposableWebPanelActivate) {
            this.disposableWebPanelActivate.dispose();
        }
    }
}

export class NeuroEditor
    implements vscode.CustomReadonlyEditorProvider<NeuroDocument>
{
    public extensionUri?: vscode.Uri;
    private activeDocument?: NeuroDocument;
    public instanceId: number;

    public constructor() {
        this.instanceId = COUNTER_VIEWER++;
        console.log("Created new editor #" + this.instanceId);
    }

    openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): NeuroDocument | Thenable<NeuroDocument> {
        return new NeuroDocument(this, uri);
    }

    async resolveCustomEditor(
        document: NeuroDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            enableForms: true,
        };
        this.activeDocument = document;

        await document.resolve(webviewPanel);
    }

    setActiveDocument(document: NeuroDocument) {
        this.activeDocument = document;
    }

    register(context: vscode.ExtensionContext) {
        this.extensionUri = context.extensionUri;

        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider(
                "nisight.surfaceviewer",
                this
            ),
            vscode.commands.registerCommand(
                "nisight.viewfile",
                (...args: unknown[]) => {
                    if (!this.activeDocument) {
                        return;
                    }

                    if (args.length > 0 && args[0] instanceof vscode.Uri) {
                        const filepath = args[0];
                        this.activeDocument.viewer.loadFile(filepath);
                    }
                }
            )
        );
    }
}
