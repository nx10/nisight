import argparse
import json
import pathlib as pl
from typing import Any, Optional
import numpy as np
    

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

    
    
def extract(file_mesh: Optional[pl.Path], file_map: Optional[pl.Path]) -> None:
    for file in (file_mesh, file_map):
        if file is not None and not file.exists():
            raise IOError(f"File '{file}' does not exist.")
    
    # Todo: Port whatever nilearn is doing here so we only depend on nibabel
    surf_mesh = nilearn.surface.load_surf_mesh(file_mesh) if file_mesh is not None else None
    surf_map = nilearn.surface.load_surf_data(file_map) if file_map is not None else None
    
    data = {
        'mesh': {'vertices': surf_mesh.coordinates.flatten(), 'faces': surf_mesh.faces.flatten()} if surf_mesh is not None else None,
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
        # import nibabel
        import nilearn.surface
        main()
    except Exception as error:
        print_as_json(error)
        raise
