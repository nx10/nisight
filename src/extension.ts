import * as vscode from "vscode";
import { SurfaceViewer } from "./surface/surfaceviewer";
import { createPythonEnvironment } from "./utils/python_environment";

export function activate(context: vscode.ExtensionContext) {
    vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Window,
            cancellable: false,
            title: "NiSight: Setting up Python environment...",
        },
        async (progress) => {
            progress.report({ increment: 0 });
            await createPythonEnvironment(context.globalStorageUri);
            progress.report({ increment: 100 });
        }
    );

    new SurfaceViewer().register(context);
}

export function deactivate() {
    //
}
