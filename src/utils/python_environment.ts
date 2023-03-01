import * as vscode from 'vscode';
import * as fs from 'fs';
import path = require('path');
import { process_capture } from '../utils/process_capture';
import { logMessage } from '../utils/logging';

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
    
    if (pythonEnvironmentExists(venvPath)) {
        logMessage(`Using Python environment at '${venvPath}'.`);
        return;
    }

    logMessage(`Creating Python environment at '${venvPath}'...`);
    const venvOutput = await process_capture(getGlobalPythonInterpreter(), ['-m', 'venv', venvPath], true);
    if (venvOutput.code !== 0)
    {
        const msg = 'Failed to create python environment.';
        logMessage(msg);
        vscode.window.showErrorMessage(msg);
        return;
    }

    logMessage('Installing Python packages...');
    const pipArgs = ['-m', 'pip', 'install'].concat(REQUIREMENTS);
    const interpreterPath = getVenvInterpreter(venvPath);
    const pipOutput = await process_capture(interpreterPath, pipArgs, true);
    if (pipOutput.code !== 0)
    {
        vscode.window.showErrorMessage('Failed to install python packages.');
        return;
    }

    const msg = 'Python environment created successfully.';
    logMessage(msg);
    vscode.window.showInformationMessage(msg);
}