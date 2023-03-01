import path = require('path');
import { spawn } from 'child_process';
import { process_capture } from '../utils/process_capture';
import * as fs from 'fs';
import * as vscode from 'vscode';

const VENV_NAME = 'venv';
const REQUIREMENTS = ['nibabel', 'nilearn'];

function pythonEnvironmentExists(location: string): boolean {
    return fs.existsSync(location);
}

function getGlobalPythonInterpreter(): string {
    const config = vscode.workspace.getConfiguration('nisight');
    return config.get<string>('pythonInterpreter', 'python');
}

function getVenvInterpreter(venvPath: string): string {
    if (process.platform === 'win32') {
        return path.join(venvPath, 'Scripts', 'python');
    }
    
    return path.join(venvPath, 'bin', 'python');
}

function windowsCompatiblePath(path: string): string {
    if (process.platform === 'win32') {
        return path.replace(/^\/+/, '');
    }
    
    return path;
}

export async function createPythonEnvironment(globalStorageUri: vscode.Uri): Promise<void> {
    const globalStoragePath = windowsCompatiblePath(globalStorageUri.path);
    const venvPath = path.join(globalStoragePath, VENV_NAME);

    let outputConsole = vscode.window.createOutputChannel('NiSight-Setup');
    
    if (pythonEnvironmentExists(venvPath)) {
        fs.rmdirSync(venvPath, { recursive: true });  // TOOO: Remove this line
        // return;
    }

    process_capture(getGlobalPythonInterpreter(), ['-m', 'venv', venvPath], outputConsole).then(async (venvOutput) => {
        if (venvOutput.code === 0) {
            const pipArgs = ['-m', 'pip', 'install'].concat(REQUIREMENTS);
            const interpreterPath = getVenvInterpreter(venvPath);
            process_capture(interpreterPath, pipArgs, outputConsole).then((pipOutput) => {
                if (pipOutput.code === 0) {
                    vscode.window.showInformationMessage('Python environment created.');
                }
                else {
                    vscode.window.showErrorMessage('Failed to install python packages.');
                }
            });
        }
        else {
            vscode.window.showErrorMessage('Failed to create python environment.');
        }
    });
}