import argparse
import json
import pathlib as pl
import sys
from enum import Enum
from typing import Union


class PlotType(Enum):
    IMG = "img"
    SURF = "surf"
    
    
def print_as_json(data: Union[str, Exception]) -> None:
    if isinstance(data, Exception):
        exception: Exception = data
        json_object = json.dumps({
            "status": "ERROR",
            "content": {
                "exception": exception.__class__.__name__,
                "message": str(exception)
            }
        })
    elif isinstance(data, str):
        content: str = data
        json_object = json.dumps({
            "status": "OK",
            "content": content
        })
    else:
        raise ValueError(f"Invalid data type {type(data)}. Valid choices are str and Exception.")

    print(json_object)


def view_img(file: pl.Path) -> None:
    if not file.exists():
        raise IOError(f"File {file} does not exist.")
    
    html_viewer = plotting.view_img(file)
    html = html_viewer.html
    
    print_as_json(html)
    
    
def view_surf(file: pl.Path) -> None:
    if not file.exists():
        raise IOError(f"File {file} does not exist.")
    
    html_viewer = plotting.view_surf(file)
    html = html_viewer.html
    
    print_as_json(html)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", required=True, choices=list(PlotType), type=PlotType)
    parser.add_argument("--file", required=True, type=pl.Path)
    args = parser.parse_args()
    
    if args.type == PlotType.IMG:
        view_img(args.file)
    elif args.type == PlotType.SURF:
        view_surf(args.file)
    else:
        raise ValueError(f"Unknown plot type {args.type}. Valid choices are {PlotType}.")


if __name__ == "__main__":
    try:
        from nilearn import plotting
        main()
    except Exception as error:
        print_as_json(error)
        raise
