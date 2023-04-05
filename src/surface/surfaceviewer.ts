import * as vscode from "vscode";
import { surfaceExtract } from "../python/surface_extract";
import {
    WebviewBackendMessage,
    WebviewFrontendMessage,
} from "./webview_message";
import path = require("path");
import { buildHtml } from "./webview_html";

interface ViewerState {
    pathMesh: vscode.Uri;
    pathMap?: vscode.Uri;
}

class SurfaceDocument implements vscode.CustomDocument {
    uri: vscode.Uri;
    extensionUri: vscode.Uri;
    public viewerState: ViewerState;
    viewerLoaded: boolean = false;
    webview?: vscode.Webview;

    constructor(uri: vscode.Uri, extensionUri: vscode.Uri) {
        this.uri = uri;
        this.extensionUri = extensionUri;
        this.viewerState = {
            pathMesh: uri,
        };
    }

    private initWebview() {
        if (!this.webview) {
            return;
        }

        this.webview.html = buildHtml(this.webview, this.extensionUri);

        this.webview.onDidReceiveMessage((msg: WebviewFrontendMessage) =>
            this.receiveWebviewMessage(msg)
        );
    }

    async viewImage(): Promise<void> {
        // Setup viewer webview if necessary
        if (!this.webview) {
            return;
        }

        if (!this.viewerLoaded) {
            this.initWebview();
            this.viewerLoaded = true;
        }

        // Extract surface data from file(s)

        const surf = await surfaceExtract(
            this.extensionUri,
            this.viewerState.pathMesh,
            this.viewerState.pathMap
        );

        if (!surf) {
            return;
        }

        // Send surface data to webview

        const msg: WebviewBackendMessage = {
            command: "SET_STATE",
            data: {
                mesh: surf.mesh
                    ? {
                          vertices: new Float32Array(surf.mesh.vertices).buffer,
                          faces: new Uint32Array(surf.mesh.faces).buffer,
                      }
                    : null,
                map: surf.map ? new Float32Array(surf.map).buffer : null,
            },
            selectMeshEntries: [
                {
                    value: this.viewerState.pathMesh.fsPath,
                    label: path.basename(this.viewerState.pathMesh.fsPath),
                },
            ],
            selectMapEntries: [
                ...(this.viewerState.pathMap
                    ? [
                          {
                              value: this.viewerState.pathMap.fsPath,
                              label: path.basename(
                                  this.viewerState.pathMap.fsPath
                              ),
                          },
                      ]
                    : []),
            ],
        };

        this.sendWebviewMessage(msg);
    }

    private sendWebviewMessage(message: WebviewBackendMessage) {
        if (!this.webview) {
            return;
        }
        return this.webview.postMessage(message);
    }

    private receiveWebviewMessage(message: WebviewFrontendMessage) {
        switch (message.command) {
            case "CHOOSE_MESH":
                vscode.window
                    .showOpenDialog({
                        title: "Select mesh",
                    })
                    .then((value?: vscode.Uri[]) => {
                        if (value && value.length > 0) {
                            this.viewerState.pathMesh = value[0];
                            this.viewImage();
                        }
                    });
                break;
            case "CHOOSE_MAP":
                vscode.window
                    .showOpenDialog({
                        title: "Select map",
                    })
                    .then((value?: vscode.Uri[]) => {
                        if (value && value.length > 0) {
                            this.viewerState.pathMap = value[0];
                            this.viewImage();
                        }
                    });
                break;
            case "SET_MESH":
                console.log("Set mesh: " + message.path);
                break;
            case "SET_MAP":
                console.log("Set map: " + message.path);
                break;

            default:
                break;
        }
    }

    dispose(): void {
        console.log("dispose doc: " + this.uri.toString());
    }
}

export class SurfaceViewer
    implements vscode.CustomReadonlyEditorProvider<SurfaceDocument>
{
    private extensionUri?: vscode.Uri;
    private activeDocument?: SurfaceDocument;

    openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): SurfaceDocument | Thenable<SurfaceDocument> {
        return new SurfaceDocument(uri, this.extensionUri as vscode.Uri);
    }
    async resolveCustomEditor(
        document: SurfaceDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
            enableForms: true,
        };

        this.activeDocument = document;

        webviewPanel.onDidChangeViewState((e) => {
            if (e.webviewPanel.visible && e.webviewPanel.active) {
                this.activeDocument = document;
            }
        });

        document.webview = webviewPanel.webview;

        if (this.extensionUri) {
            await document.viewImage();
        }
    }

    register(context: vscode.ExtensionContext) {
        this.extensionUri = context.extensionUri;

        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider(
                "nisight.surfaceviewer",
                this
            ),
            vscode.commands.registerCommand('nisight.viewfile', (...args: unknown[]) => {
                if (!this.activeDocument) {
                    return;
                }

                if (args.length > 0 && args[0] instanceof vscode.Uri) {
                    const filepath = args[0];
                    
                    this.activeDocument.viewerState.pathMap = filepath;
                    this.activeDocument.viewImage();
                }
            })
        );
    }
}
