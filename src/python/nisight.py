import argparse
import json
import pathlib as pl
import sys
from enum import Enum
from typing import Any, Union, Optional


class PlotType(Enum):
    IMG = "img"
    SURF = "surf"
    
    
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
        
    try:
        json_object = json.dumps({
            "status": "OK",
            "content": data
        })
    except TypeError:
        raise TypeError(f"Data type {type(data)} is not json serializable.")

    print(json_object)


def view_img(file: pl.Path) -> None:
    if not file.exists():
        raise IOError(f"File {file} does not exist.")
    
    img = nibabel.load(file)

    if len(img.shape) == 3:
        show_slice = img
    elif len(img.shape) == 4: # time series -> show first image
        from nilearn.image import index_img
        show_slice = index_img(img, 0)
    else:
        raise Exception('Image has wrong dimensions: ' + img.shape)
    
    html_viewer = plotting.view_img(show_slice, bg_img=False, black_bg=True, resampling_interpolation="nearest")
    html = html_viewer.html
    
    print_as_json(html)
    
    
def view_surf(file_mesh: pl.Path, file_map: Optional[pl.Path] = None) -> None:
    if not file_mesh.exists():
        raise IOError(f"File {file_mesh} does not exist.")
    
    html_viewer = plotting.view_surf(file_mesh, file_map, black_bg=True)
    html = html_viewer.html
    
    print_as_json(html)
    
    
def get_num_vertices(file: pl.Path) -> int:
    if not file.exists():
        raise IOError(f"File {file} does not exist.")
    
    img = nibabel.load(file)
    vertices = img.darrays[0]
    num_vertices = vertices.dims[0]
    
    print_as_json(num_vertices)


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='command')
    view_parser = subparsers.add_parser('view')
    view_parser.add_argument("--file", required=True, type=pl.Path)
    view_parser.add_argument("--file2", default=None, type=pl.Path)
    view_parser.add_argument("--type", required=True, choices=list(PlotType), type=PlotType)
    vertices_parser = subparsers.add_parser('vertices')
    vertices_parser.add_argument("--file", required=True, type=pl.Path)
    args = parser.parse_args()
    
    if args.command == 'view':
        if args.type == PlotType.IMG:
            view_img(args.file)
        elif args.type == PlotType.SURF:
            view_surf(args.file, args.file2)
        else:
            raise ValueError(f"Unknown plot type {args.type}. Valid choices are {PlotType}.")
    elif args.command == 'vertices':
        get_num_vertices(file=args.file)


if __name__ == "__main__":
    try:
        import nibabel
        from nilearn import plotting
        main()
    except Exception as error:
        print_as_json(error)
        raise
