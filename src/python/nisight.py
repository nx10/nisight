import argparse
import json
import pathlib as pl
import sys
from enum import Enum

from nilearn import plotting


class PlotType(Enum):
    IMG = "img"
    SURF = "surf"
    
    
def print_json(data: dict) -> None:
    json_object = json.dumps(data)
    print(json_object)


def view_img(file: pl.Path) -> None:
    if not file.exists():
        raise IOError(f"File {file} does not exist.")
    
    html_viewer = plotting.view_img(file)
    html = html_viewer.html
    
    print_json(data={"html": html})
    
    
def view_surf(file: pl.Path) -> None:
    if not file.exists():
        raise IOError(f"File {file} does not exist.")
    
    html_viewer = plotting.view_surf(file)
    html = html_viewer.html
    
    print_json(data={"html": html})


if __name__ == "__main__":
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
    