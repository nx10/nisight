import argparse
import gzip
import json
import pathlib as pl
from typing import Any, Optional
import numpy as np
import nibabel
    

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)
    
    
def print_as_json(data: Any) -> None:
    if isinstance(data, Exception):
        exception: Exception = data
        json_object = json.dumps({
            "status": "ERROR",
            "content": {
                "exception": exception.__class__.__name__,
                "message": str(exception)
            }
        })
        print(json_object)
        return
    
    try:
        json_object = json.dumps({
            "status": "OK",
            "content": data
        }, cls=NumpyEncoder)
        print(json_object)
    except TypeError:
        print_as_json(TypeError(f"Data type {type(data)} is not json serializable."))


def _load_gifti_gzip(filepath: pl.Path) -> nibabel.gifti.gifti.GiftiImage:
    with gzip.open(filepath) as f:
        as_bytes = f.read()
    parser = nibabel.gifti.gifti.GiftiImage.parser()
    parser.parse(as_bytes)
    return parser.img


def load_surf_mesh(filepath: pl.Path):

    if not filepath.exists():
        raise ValueError("File does not exist.")

    filename = filepath.name

    if (filename.endswith('.orig') or filename.endswith('.pial') or
        filename.endswith('.white') or filename.endswith('.sphere') or
        filename.endswith('.inflated')):
        coords, faces, header = nibabel.freesurfer.io.read_geometry(filepath, read_metadata=True)

        # See https://github.com/nilearn/nilearn/pull/3235
        if 'cras' in header:
            coords += header['cras']
        
        return coords, faces

    if filename.endswith('.gii') or filename.endswith('.gii.gz'):

        img: nibabel.gifti.gifti.GiftiImage = _load_gifti_gzip(filepath) if filename.endswith('.gii.gz') else nibabel.load(filepath)

        coords =  img.get_arrays_from_intent(
            nibabel.nifti1.intent_codes['NIFTI_INTENT_POINTSET'])[0].data
        
        faces = img.get_arrays_from_intent(
            nibabel.nifti1.intent_codes['NIFTI_INTENT_TRIANGLE'])[0].data

        return coords, faces
    
    raise ValueError("Not a supported file format.")


def load_surf_data(filepath: pl.Path):

    if not filepath.exists():
        raise ValueError("File does not exist.")
    
    filename = filepath.name

    if (filename.endswith('nii') or filename.endswith('nii.gz') or
            filename.endswith('mgz')):
        data_part = np.squeeze(np.asanyarray(nibabel.load(filepath)._dataobj))
    elif (
        filename.endswith('area')
        or filename.endswith('curv')
        or filename.endswith('sulc')
        or filename.endswith('thickness')
    ):
        data_part = nibabel.freesurfer.io.read_morph_data(filepath)
    elif filename.endswith('annot'):
        data_part = nibabel.freesurfer.io.read_annot(filepath)[0]
    elif filename.endswith('label'):
        data_part = nibabel.freesurfer.io.read_label(filepath)
    elif filename.endswith('gii'):
        data_part = np.asarray([arr.data for arr in nibabel.load(filepath).darrays]).T.squeeze()
    elif filename.endswith('gii.gz'):
        data_part = np.asarray([arr.data for arr in _load_gifti_gzip(filepath).darrays]).T.squeeze()

    if len(data_part.shape) == 1:
        data_part = data_part[:, np.newaxis]

    return np.squeeze(data_part)

    
def extract(file_mesh: Optional[pl.Path], file_map: Optional[pl.Path]) -> None:
    for file in (file_mesh, file_map):
        if file is not None and not file.exists():
            raise IOError(f"File '{file}' does not exist.")
    
    coordinates, faces = load_surf_mesh(file_mesh) if file_mesh is not None else (None, None)
    surf_map = load_surf_data(file_map) if file_map is not None else None
    
    data = {
        'mesh': {'vertices': coordinates.flatten(), 'faces': faces.flatten()} if coordinates is not None else None,
        'map': surf_map
    }

    return data
    

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mesh", default=None, type=pl.Path)
    parser.add_argument("--map", default=None, type=pl.Path)
    args = parser.parse_args()

    data = extract(args.mesh, args.map)
    
    print_as_json(data)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print_as_json(error)
        raise
