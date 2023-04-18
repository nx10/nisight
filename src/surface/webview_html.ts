import * as vscode from "vscode";
import { getWebviewUri } from "../utils/path_utils";

export function buildHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const webviewUri = getWebviewUri(webview, extensionUri, [
        "dist",
        "webview.js",
    ]);

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

        #legend {
            position: absolute;
            top: 80px;
            left: 20px;
        }
      </style>
    </head>
    
    <body>
      <div style="display:flex;flex-direction:column; height:100%;">
        <div id="viewer-ui" style="display:flex;flex-direction:row;justify-content: left; align-items: center;">
    
          <!--<div style="display:flex;flex-direction:column; margin: 1em; min-width: 80px;">
            <label for="mesh-dropdown">Mesh:</label>
            <vscode-dropdown id="mesh-dropdown" style="min-width: 80px;"></vscode-dropdown>
          </div>
          <vscode-button id="button-select-mesh" style="margin-right: 1em;">Files...</vscode-button>
    
          <div style="display:flex;flex-direction:column; margin: 1em; min-width: 80px;">
            <label for="map-dropdown">Map:</label>
            <vscode-dropdown id="map-dropdown" style="min-width: 80px;"></vscode-dropdown>
          </div>-->
          <vscode-button id="button-select-file">Load file</vscode-button>

          <div style="display:flex;flex-direction:column; margin: 1em; min-width: 80px;">
            <label for="dropdown-color">Color:</label>
            <vscode-dropdown id="dropdown-color" style="min-width: 80px;"></vscode-dropdown>
          </div>
          
        </div>
        <div id="viewer"></div>
        <svg id="legend"></svg>
      </div>
    
      <script src="${webviewUri}"></script>
    </body>
    
    </html>
    `;
}