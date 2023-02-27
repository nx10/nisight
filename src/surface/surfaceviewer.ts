import * as vscode from 'vscode';
import { process_capture } from '../utils/process_capture';
import { parse_python_message } from '../python_message';
import { logPythonException } from '../utils/logging';


const SHOW_OUTPUT_CONSOLE_ACTION = 'Show output console';

import { Uri, Webview } from "vscode";

export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

/** https://stackoverflow.com/questions/7753448/how-do-i-escape-quotes-in-html-attribute-values */
function quoteattr(s: string, preserveCR?: string) {
    preserveCR = preserveCR ? '&#13;' : '\n';
    return ('' + s) /* Forces the conversion to string. */
        .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
        .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        /*
        You may add other replacements here for HTML only 
        (but it's not necessary).
        Or for XML, only if the named entities are defined in its DTD.
        */
        .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
        .replace(/[\r\n]/g, preserveCR);
}

function build_html(webview: Webview, extensionUri: Uri, iFrameSource?: string) {
    const webviewUri = getUri(webview, extensionUri, ["dist", "webview.js"]);

    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Hello World!</title>
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
      <div style="display:flex;flex-direction:column; height:100%">
        <div style="display:flex;flex-direction:row">
    
          <div style="display:flex;flex-direction:column; margin: 1em">
            <label for="my-dropdown">Mesh:</label>
            <vscode-dropdown id="my-dropdown">
              <vscode-option>path/to/mesh1.blub</vscode-option>
              <vscode-option>path/to/mesh2.blub</vscode-option>
              <vscode-option>path/to/mesh3.blub</vscode-option>
              <vscode-option>Select file...</vscode-option>
            </vscode-dropdown>
          </div>
    
          <div style="display:flex;flex-direction:column; margin: 1em">
            <label for="my-dropdown">Map:</label>
            <vscode-dropdown id="my-dropdown">
              <vscode-option>path/to/map1.blub</vscode-option>
              <vscode-option>path/to/map2.blub</vscode-option>
              <vscode-option>path/to/map3.blub</vscode-option>
              <vscode-option>Select file...</vscode-option>
            </vscode-dropdown>
          </div>
        </div>
    
        <iframe id="viewer-iframe" srcdoc="${iFrameSource ? quoteattr(iFrameSource) : ''}" style="flex:1"></iframe>
      </div>
    
      <script src="${webviewUri}"></script>
    </body>
    
    </html>
    `;
}

class SurfaceDocument implements vscode.CustomDocument {
    uri: vscode.Uri;

    constructor(uri: vscode.Uri) {
        this.uri = uri;
    }

    async getNumVertices(file: string): Promise<number> {
        const config = vscode.workspace.getConfiguration('nisight');
        const pythonInterpreter = config.get<string>('pythonInterpreter', 'python');

        const processOutput = await process_capture(pythonInterpreter, [__dirname + '/../src/python/nisight.py', 'vertices', '--file', file]);

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

        const config = vscode.workspace.getConfiguration('nisight');
        const pythonInterpreter = config.get<string>('pythonInterpreter', 'python');

        const processOutput = await process_capture(pythonInterpreter, [__dirname + '/../src/python/nisight.py', 'view', '--type', 'surf', '--file', this.uri.fsPath]);

        let msg;
        try {
            msg = parse_python_message(processOutput.message);
        } catch (error) {
            console.error(error);
            return;
        }

        if (msg.status === 'OK') {
            console.log(msg.content);

            webviewPanel.webview.html = build_html(webviewPanel.webview, extensionUri, msg.content as string);//
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

    openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): SurfaceDocument | Thenable<SurfaceDocument> {
        console.log(uri);
        return new SurfaceDocument(uri);
    }
    async resolveCustomEditor(document: SurfaceDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
        console.log('resolve');
        webviewPanel.webview.options = {
            enableScripts: true,
            enableForms: true,
        };
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