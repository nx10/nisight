import * as vscode from 'vscode';
import { VoxelViewer } from './voxel/voxelviewer';
import { SurfaceViewer } from './surface/surfaceviewer';
import { createPythonEnvironment } from './utils/python_environment';

export function activate(context: vscode.ExtensionContext) {
	createPythonEnvironment(context.globalStorageUri);
	new VoxelViewer().register(context);
	new SurfaceViewer().register(context);
}

export function deactivate() { }
