import * as vscode from "vscode";
import * as fs from "fs";
import path = require("path");
import { processCapture } from "../utils/process_capture";
import { logMessage, showOutputConsole } from "../utils/logging";
import { getUri, windowsCompatiblePath } from "../utils/path_utils";

const VENV_NAME = "venv";
const REQUIREMENTS = ["nibabel"];

const config = vscode.workspace.getConfiguration("nisight");

function getPythonExecutableName(): string {
    if (process.platform === "win32") {
        return "python.exe";
    }

    return "python";
}

function getInterpreterPathRelativeToVenv(venvPath: string): string {
    if (process.platform === "win32") {
        return path.join(venvPath, "Scripts", "python.exe");
    }

    return path.join(venvPath, "bin", "python");
}

function venvExists(): boolean {
    const pythonInterpreter = config.get<string>("pythonVenv");
    return pythonInterpreter !== undefined && fs.existsSync(pythonInterpreter);
}

function getBaseInterpreter(): string {
    return config.get<string>(
        "pythonBaseInterpreter",
        getPythonExecutableName()
    );
}

export function getVenvInterpreter(): string | undefined {
    if (venvExists()) {
        return config.get<string>("pythonVenv");
    }

    return undefined;
}

export async function createPythonEnvironment(
    globalStorageUri: vscode.Uri
): Promise<void> {
    const globalStoragePath = windowsCompatiblePath(globalStorageUri.path);
    const venvPath = path.join(globalStoragePath, VENV_NAME);

    showOutputConsole();

    if (venvExists()) {
        logMessage(`Using Python environment at '${venvPath}'.`);
        return;
    }

    logMessage(`Checking python interpreter...`);
    const versionOutput = await processCapture(
        getBaseInterpreter(),
        ["--version"],
        true
    );
    if (versionOutput.code !== 0) {
        const msg = "Failed to find python interpreter (check extension settings).";
        logMessage(msg);
        vscode.window.showErrorMessage(msg);
        return;
    }

    logMessage(`Creating Python environment at '${venvPath}'...`);
    const venvOutput = await processCapture(
        getBaseInterpreter(),
        ["-m", "venv", venvPath],
        true
    );
    if (venvOutput.code !== 0) {
        const msg = "Failed to create python environment.";
        logMessage(msg);
        vscode.window.showErrorMessage(msg);
        return;
    }

    logMessage("Installing Python packages...");
    const pipArgs = ["-m", "pip", "install"].concat(REQUIREMENTS);
    const interpreterPath = getInterpreterPathRelativeToVenv(venvPath);
    const pipOutput = await processCapture(interpreterPath, pipArgs, true);
    if (pipOutput.code !== 0) {
        vscode.window.showErrorMessage("Failed to install python packages.");
        return;
    }

    const msg = "Python environment created successfully.";
    logMessage(msg);
    vscode.window.showInformationMessage(msg);

    config.update("pythonVenv", interpreterPath);
}

export function getPyFilepath(
    extensionUri: vscode.Uri,
    pyImport: string
): vscode.Uri {
    return getUri(extensionUri, ["dist", pyImport]);
}
