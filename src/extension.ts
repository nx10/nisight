import * as vscode from 'vscode';
import { VoxelViewer } from './voxel/voxelviewer';
import { SurfaceViewer } from './surface/surfaceviewer';

export function activate(context: vscode.ExtensionContext) {
	new VoxelViewer().register(context);
	new SurfaceViewer().register(context);
}

export function deactivate() { }
