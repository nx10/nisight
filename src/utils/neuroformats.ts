import * as vscode from "vscode";

const RX_SURFACE_MESH_FREESURFER: RegExp[] = [
    /.pial$/,
    /.white$/,
    /.inflated$/,
    // /.smoothwm$/, // not recognized by nilearn? What is this?
    /.sphere$/,
    /.orig$/,
];
const RX_SURFACE_MAP_FREESURFER: RegExp[] = [
    /.sulc$/,
    /.volume$/,
    /.thickness$/,
];

const RX_SURFACE_MESH_GIFTI: RegExp[] = [/.surf.gii$/, /.coord.gii$/];
const RX_SURFACE_MAP_GIFTI: RegExp[] = [
    /.shape.gii$/,
    /.func.gii$/,
    /.label.gii$/,
];

// RX_SURFACE_MESH_CIFTI = ()
const RX_SURFACE_MAP_CIFTI: RegExp[] = [
    /.dlabel.nii$/,
    /.dtseries.nii$/,
    /.dscalar.nii$/,
];

const RX_VOLUME_VOXEL_NIFTI: RegExp[] = [/.nii$/, /.nii.gz$/];

export enum NiFileStandard {
    freesurfer = 'freesurfer',
    cifti = 'cifti',
    gifti = 'gifti',
    nifti = 'nifti',
}

export enum NiFileModality {
    volumeVoxel = 'volume_voxel',
    surfaceMesh = 'surface_mesh',
    surfaceMap = 'surface_map',
}

export enum NiFileObject {
    /** Right brain hemisphere */
    hemiRight = 'hemi_right',
    /** Left brain hemisphere */
    hemiLeft = 'hemi_left',
}

export interface NeuroMetaData {
    standard?: NiFileStandard;
    modality?: NiFileModality;
    object?: NiFileObject;
    meta?: Record<string, string>;
}

function matchesAny(uri: vscode.Uri, regexps: RegExp[]) {
    for (const rx of regexps) {
        if (rx.test(uri.fsPath)) {
            return true;
        }
    }
    return false;
}

export function readNeuroMetaData(uri: vscode.Uri): NeuroMetaData {
    if (matchesAny(uri, RX_SURFACE_MESH_FREESURFER)) {
        return {
            standard: NiFileStandard.freesurfer,
            modality: NiFileModality.surfaceMesh,
        };
    }
    if (matchesAny(uri, RX_SURFACE_MAP_FREESURFER)) {
        return {
            standard: NiFileStandard.freesurfer,
            modality: NiFileModality.surfaceMap,
        };
    }
    if (matchesAny(uri, RX_SURFACE_MESH_GIFTI)) {
        return {
            standard: NiFileStandard.gifti,
            modality: NiFileModality.surfaceMesh,
        };
    }
    if (matchesAny(uri, RX_SURFACE_MAP_GIFTI)) {
        return {
            standard: NiFileStandard.gifti,
            modality: NiFileModality.surfaceMap,
        };
    }
    if (matchesAny(uri, RX_SURFACE_MAP_CIFTI)) {
        return {
            standard: NiFileStandard.cifti,
            modality: NiFileModality.surfaceMap,
        };
    }
    if (matchesAny(uri, RX_VOLUME_VOXEL_NIFTI)) {
        return {
            standard: NiFileStandard.nifti,
            modality: NiFileModality.volumeVoxel,
        };
    }

    return {};
}
