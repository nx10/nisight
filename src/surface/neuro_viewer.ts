import * as vscode from "vscode";
import { buildHtml } from "./webview_html";
import { NeuroDocument } from "./neuro_editor";
import {
    WebviewBackendMessage,
    WebviewFrontendMessage,
} from "./webview_message";
import { NiFileModality, readNeuroMetaData } from "../utils/neuroformats";
import {
    mapExtract,
    meshExtract,
    surfaceExtract,
} from "../python/surface_extract";

export class NeuroViewer {
    private document: NeuroDocument;

    constructor(document: NeuroDocument) {
        this.document = document;
    }

    public buildHtml(): string {
        if (!this.document.webviewPanel || !this.document.editor.extensionUri) {
            return "";
        }
        return buildHtml(
            this.document.webviewPanel.webview,
            this.document.editor.extensionUri
        );
    }

    async loadFile(uri: vscode.Uri) {
        console.log("Load " + uri);
        const meta = readNeuroMetaData(uri);
        console.log(meta);

        // Setup viewer webview if necessary
        /*if (!this.webview) {
            return;
        }

        if (!this.viewerLoaded) {
            this.initWebview();
            this.viewerLoaded = true;
        }*/

        // Extract surface data from file(s)

        if (!this.document.editor.extensionUri) {
            return;
        }

        const msg: WebviewBackendMessage = {
            command: "SET_STATE",
            data: {
                mesh: null,
                map: null,
            },
            selectMeshEntries: [],
            selectMapEntries: [],
        };

        if (meta.modality === NiFileModality.surfaceMesh) {
            const mesh = await meshExtract(
                this.document.editor.extensionUri,
                uri
            );

            if (mesh) {
                msg.data.mesh = {
                    vertices: new Float32Array(mesh.vertices).buffer,
                    faces: new Uint32Array(mesh.faces).buffer,
                };
            }
        } else if (meta.modality === NiFileModality.surfaceMap) {
            const map = await mapExtract(
                this.document.editor.extensionUri,
                uri
            );

            if (map) {
                msg.data.map = new Float32Array(map).buffer;
            }
        }

        // Send surface data to webview

        if (msg.data.map || msg.data.mesh) {
            this.document.sendWebviewMessage(msg);
        }
    }

    public handleWebviewMessage(message: WebviewFrontendMessage) {
        switch (message.command) {
            case "CHOOSE_MESH":
                vscode.window
                    .showOpenDialog({
                        title: "Select mesh",
                    })
                    .then((value?: vscode.Uri[]) => {
                        if (value && value.length > 0) {
                            this.loadFile(value[0]);
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
                            this.loadFile(value[0]);
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
}
