import * as vscode from "vscode";
import { NeuroEditor } from "./surface/neuro_editor";
import { createPythonEnvironment } from "./utils/python_environment";

export async function activate(context: vscode.ExtensionContext) {
    await vscode.window.withProgress(
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

    new NeuroEditor().register(context);
}

export function deactivate() {
    //
}
