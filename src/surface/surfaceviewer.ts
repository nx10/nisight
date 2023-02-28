import * as vscode from 'vscode';
import { process_capture } from '../utils/process_capture';
import { parse_python_message } from '../python_message';
import { logPythonException } from '../utils/logging';
import { quoteattr } from '../utils/string_utils';
import * as fs from 'fs';


const SHOW_OUTPUT_CONSOLE_ACTION = 'Show output console';

import { Uri, Webview } from "vscode";
import { WebviewBackendMessage, WebviewFrontendMessage } from '../webview_message';
import path = require('path');

export function getUri(extensionUri: Uri, pathList: string[]) {
    return Uri.joinPath(extensionUri, ...pathList);
}

export function getWebviewUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

function build_html(webview: Webview, extensionUri: Uri) {
    const webviewUri = getWebviewUri(webview, extensionUri, ["dist", "webview.js"]);

    const loadingHtml = quoteattr(fs.readFileSync(getUri(extensionUri, ["src", "html", "loading.html"]).fsPath, 'utf8'));

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
        <div style="display:flex;flex-direction:row;justify-content: left; align-items: center;">
    
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
        <iframe id="viewer-iframe" srcdoc="${loadingHtml}" style="flex:1"></iframe>
      </div>
    
      <script src="${webviewUri}"></script>
    </body>
    
    </html>
    `;
}

interface ViewerState {
    path_mesh: string;
    path_map?: string;
}

class SurfaceDocument implements vscode.CustomDocument {
    uri: vscode.Uri;
    extensionUri: vscode.Uri;
    viewerState: ViewerState;

    constructor(uri: vscode.Uri, extensionUri: vscode.Uri) {
        this.uri = uri;
        this.extensionUri = extensionUri;
        this.viewerState = {
            path_mesh: uri.fsPath
        }
    }

    async getNumVertices(file: string): Promise<number> {
        const config = vscode.workspace.getConfiguration('nisight');
        const pythonInterpreter = config.get<string>('pythonInterpreter', 'python');

        const pyPath = getUri(this.extensionUri, ['src', 'python', 'nisight.py']).fsPath;
        const processOutput = await process_capture(pythonInterpreter, [pyPath, 'vertices', '--file', file]);

        let msg;
        try {
            msg = parse_python_message(processOutput.message);
        } catch (error) {
            console.error(error);
            return -1;
        }

        if (msg.status === 'OK') {
            return parseInt(msg.content);
        }
        else if (msg.status === 'ERROR') {
            logPythonException(msg.content);
        }

        return -1;
    }

    async viewImage(webviewPanel: vscode.WebviewPanel, extensionUri: Uri): Promise<void> {
        
        webviewPanel.webview.html = build_html(webviewPanel.webview, extensionUri);

        const use_dark_bg = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark || 
            vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;
        // todo: pass this in python to nilearn.plotting.view_surf(black_bg=use_dark_bg)

        const config = vscode.workspace.getConfiguration('nisight');
        const pythonInterpreter = config.get<string>('pythonInterpreter', 'python');

        const pyPath = getUri(this.extensionUri, ['src', 'python', 'nisight.py']).fsPath;
        let args = [pyPath, 'view', '--type', 'surf', '--file', this.viewerState.path_mesh];

        if (this.viewerState.path_map) {
            args.push('--file2', this.viewerState.path_map);
        }

        const processOutput = await process_capture(pythonInterpreter, args);

        if (processOutput.code !== 0) {
            console.error(`Python process had non-zero exit code. Message body: '${processOutput.message}'`);
            return;
        }

        let msg;
        try {
            msg = parse_python_message(processOutput.message);
        } catch (error) {
            console.error(error);
            return;
        }

        if (msg.status === 'OK') {
            webviewPanel.webview.postMessage({
                command: 'SET_STATE',
                iframe_contents: msg.content,
                select_mesh_entries: [
                    { value: this.viewerState.path_mesh, label: path.basename(this.viewerState.path_mesh) }
                ],
                select_map_entries: [
                    ...(this.viewerState.path_map ? [{ value: this.viewerState.path_map, label: path.basename(this.viewerState.path_map) }] : [])
                ]
            });
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
    private extensionUri?: Uri;
    private webviewPanel?: vscode.WebviewPanel;
    private document?: SurfaceDocument;

    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): SurfaceDocument | Thenable<SurfaceDocument> {
        console.log(uri);
        return new SurfaceDocument(uri, this.extensionUri as Uri);
    }
    async resolveCustomEditor(document: SurfaceDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
        console.log('resolve');
        webviewPanel.webview.options = {
            enableScripts: true,
            enableForms: true,
        };
        this.webviewPanel = webviewPanel;
        this.document = document;

        webviewPanel.webview.onDidReceiveMessage(
            (message: WebviewFrontendMessage) => {

                switch (message.command) {
                    case 'CHOOSE_MESH':
                        vscode.window.showOpenDialog({
                            title: 'Select mesh'
                        }).then((value?: vscode.Uri[]) => {
                            if (value && value.length > 0) {
                                if (this.document && this.webviewPanel && this.extensionUri) {
                                    this.document.viewerState.path_mesh = value[0].path;
                                    this.document.viewImage(this.webviewPanel, this.extensionUri);
                                }
                            }
                        });
                        break;
                    case 'CHOOSE_MAP':
                        vscode.window.showOpenDialog({
                            title: 'Select map'
                        }).then((value?: vscode.Uri[]) => {
                            if (value && value.length > 0) {
                                if (this.document && this.webviewPanel && this.extensionUri) {
                                    this.document.viewerState.path_map = value[0].path;
                                    this.document.viewImage(this.webviewPanel, this.extensionUri);
                                }
                            }
                        });
                        break;
                    case 'SET_MESH':
                        console.log('Set mesh: ' + message.path);
                        break;
                    case 'SET_MAP':
                        console.log('Set map: ' + message.path);
                        break;

                    default:
                        break;
                }
            }
        );

        if (this.extensionUri)
            await document.viewImage(webviewPanel, this.extensionUri);
    }

    register(context: vscode.ExtensionContext) {

        this.extensionUri = context.extensionUri

        context.subscriptions.push(
            vscode.window.registerCustomEditorProvider('nisight.surfaceviewer', this)
        );
    }
}