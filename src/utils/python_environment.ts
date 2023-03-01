import path = require('path');
import { spawn } from 'child_process';
import { process_capture } from '../utils/process_capture';
import * as fs from 'fs';
import * as vscode from 'vscode';

const VENV_NAME = 'venv';
const REQUIREMENTS = ['nibabel', 'nilearn', 'matplotlib'];

function pythonEnvironmentExists(location: string): boolean {
    return fs.existsSync(location);
}

function getGlobalPythonInterpreter(): string {
    const config = vscode.workspace.getConfiguration('nisight');
    return config.get<string>('pythonInterpreter', 'python');
}

function windowsCompatiblePath(path: string): string {
    if (process.platform !== 'win32') {
        return path;
    }

    return path.replace(/^\\+/, '');
}

export async function createPythonEnvironment(globalStorageUri: vscode.Uri): Promise<void> {
    const extensionStoragePath = globalStorageUri.path;
    const envPath = windowsCompatiblePath(path.join(extensionStoragePath, VENV_NAME));
    const outputConsole = vscode.window.createOutputChannel('NiSight-Debug');
    
    if (pythonEnvironmentExists(envPath)) {
        fs.rmdirSync(envPath, { recursive: true });  // TOOO: Remove this line
        // return;
    }

    process_capture(getGlobalPythonInterpreter(), ['-m', 'venv', envPath], outputConsole).then(async (venvOutput) => {
        if (venvOutput.code === 0) {
            const pipArgs = ['-m', 'pip', 'install'].concat(REQUIREMENTS);
            const interpreterPath = path.join(envPath, 'bin', 'python.exe');
            const res = await process_capture(interpreterPath, pipArgs, outputConsole);
            // .then((pipOutput) => {
            //     if (pipOutput.code === 0) {
            //         vscode.window.showInformationMessage('Python environment created.');
            //     }
            //     else {
            //         vscode.window.showErrorMessage('Failed to install python packages.');
            //     }
            // });
        }
        else {
            vscode.window.showErrorMessage('Failed to create python environment.');
        }
    });
}