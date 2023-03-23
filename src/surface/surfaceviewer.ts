import * as fs from "fs";
import * as vscode from "vscode";
import { Uri, Webview } from "vscode";
import loading_html from "../html/loading.html";
import { surfaceExtract } from "../python/surface_extract";
import { getUri, getWebviewUri } from "../utils/path_utils";
import { quoteattr } from "../utils/string_utils";
import {
    WebviewBackendMessage,
    WebviewFrontendMessage,
} from "./webview_message";
import path = require("path");

function buildHtml(webview: Webview, extensionUri: Uri) {
    const webviewUri = getWebviewUri(webview, extensionUri, [
        "dist",
        "webview.js",
    ]);

    const loadingHtml = quoteattr(
        fs.readFileSync(
            getUri(extensionUri, ["dist", loading_html]).fsPath,
            "utf8"
        )
    );

    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Surface</title>
      <style>
        html {
          height: 100%;
        }
    
        body {
          height: 100%;
          padding: 0;
        }
    
        #viewer-iframe {
          border: none;
        }
      </style>
    </head>
    
    <body>
      <div style="display:flex;flex-direction:column; height:100%;">
        <div id="viewer-ui" style="display:flex;flex-direction:row;justify-content: left; align-items: center;">
    
          <div style="display:flex;flex-direction:column; margin: 1em; min-width: 80px;">
            <label for="mesh-dropdown">Mesh:</label>
            <vscode-dropdown id="mesh-dropdown" style="min-width: 80px;"></vscode-dropdown>
          </div>
          <vscode-button id="button-select-mesh" style="margin-right: 1em;">Files...</vscode-button>
    
          <div style="display:flex;flex-direction:column; margin: 1em; min-width: 80px;">
            <label for="map-dropdown">Map:</label>
            <vscode-dropdown id="map-dropdown" style="min-width: 80px;"></vscode-dropdown>
          </div>
          <vscode-button id="button-select-map">Files...</vscode-button>
          
        </div>
        <div id="viewer"></div>
        <!--<iframe id="viewer-iframe" srcdoc="${loadingHtml}" style="flex:1"></iframe>-->
      </div>
    
      <script src="${webviewUri}"></script>
    </body>
    
    </html>
    `;
}

interface ViewerState {
    pathMesh: Uri;
    pathMap?: Uri;
}

class SurfaceDocument implements vscode.CustomDocument {
    uri: vscode.Uri;
    extensionUri: vscode.Uri;
    viewerState: ViewerState;
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
    private extensionUri?: Uri;

    openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken
    ): SurfaceDocument | Thenable<SurfaceDocument> {
        return new SurfaceDocument(uri, this.extensionUri as Uri);
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
            )
        );
    }
}
