import * as vscode from 'vscode';
import { VoxelViewer } from './voxel/voxelviewer';
import { SurfaceViewer } from './surface/surfaceviewer';

export function activate(context: vscode.ExtensionContext) {


	new VoxelViewer().register(context);

	const surfaceDisposable = vscode.window.registerCustomEditorProvider('nisight.surfaceviewer', new SurfaceViewer());
	context.subscriptions.push(surfaceDisposable);
}

export function deactivate() { }
