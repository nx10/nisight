import {
    Button,
    Dropdown,
    Option,
    provideVSCodeDesignSystem,
    vsCodeBadge,
    vsCodeButton,
    vsCodeCheckbox,
    vsCodeDataGrid,
    vsCodeDataGridCell,
    vsCodeDataGridRow,
    vsCodeDivider,
    vsCodeDropdown,
    vsCodeLink,
    vsCodeOption,
    vsCodePanels,
    vsCodePanelTab,
    vsCodePanelView,
    vsCodeProgressRing,
    vsCodeRadio,
    vsCodeRadioGroup,
    vsCodeTag,
    vsCodeTextArea,
    vsCodeTextField,
} from "@vscode/webview-ui-toolkit";
import { type WebviewApi } from "vscode-webview";
import {
    WebviewFrontendMessage,
    WebviewBackendMessage,
} from "../webview_message";
import { Legend } from "./legend";

import { SerializableViewerState, ViewerClient } from "./viewer_client";
import { colorInterpolates } from "./d3_color_schemes";
import { createDocElem, getDocElem } from "./utils";

// TODO: we do not need all of these

provideVSCodeDesignSystem().register(
    vsCodeBadge(),
    vsCodeButton(),
    vsCodeCheckbox(),
    vsCodeDataGrid(),
    vsCodeDataGridCell(),
    vsCodeDataGridRow(),
    vsCodeDivider(),
    vsCodeDropdown(),
    vsCodeLink(),
    vsCodeOption(),
    vsCodePanels(),
    vsCodePanelTab(),
    vsCodePanelView(),
    vsCodeProgressRing(),
    vsCodeRadio(),
    vsCodeRadioGroup(),
    vsCodeTag(),
    vsCodeTextArea(),
    vsCodeTextField()
);

// eslint-disable-next-line no-var
var vscodeApi = acquireVsCodeApi<SerializableViewerState>();
// eslint-disable-next-line no-var
var viewerClient: ViewerClient | undefined = undefined;

/*function vscPostMessage(message: WebviewFrontendMessage) {
    return vscodeApi.postMessage(message);
}*/

/*function updateState(state: ViewerState) {
    //const meshDropdown: Dropdown = getDocElem("mesh-dropdown");
    //const mapDropdown: Dropdown = getDocElem("map-dropdown");


    mapDropdown.innerHTML = "";
    message.selectMapEntries.map((e) => {
        const opt: Option = getDocElem("vscode-option");
        opt.value = e.value;
        opt.innerHTML = e.label;
        mapDropdown.appendChild(opt);
    });

    meshDropdown.innerHTML = "";
    message.selectMeshEntries.map((e) => {
        const opt: Option = getDocElem("vscode-option");
        opt.value = e.value;
        opt.innerHTML = e.label;
        meshDropdown.appendChild(opt);
    });
}*/

function onLoad() {
    const dropdownColor: Dropdown = getDocElem("dropdown-color");
    dropdownColor.innerHTML = "";
    Object.keys(colorInterpolates).map((e) => {
        const opt: Option = createDocElem("vscode-option");
        opt.value = e;
        opt.innerHTML = e;
        dropdownColor.appendChild(opt);
    });
    dropdownColor.value = 'Viridis';
    dropdownColor.onchange = () => {
        viewerClient?.setModel(undefined, undefined, dropdownColor.value);
    };
}

function initWebview() {

    viewerClient = new ViewerClient();

    const oldState = vscodeApi.getState();
    if (oldState) {
        console.log("loaded old state");
        viewerClient.setSerializableState(oldState);
    }

    window.addEventListener("message", (ev: MessageEvent<unknown>) => {
        if (!viewerClient) {
            return;
        }
        const message = ev.data as WebviewBackendMessage;

        switch (message.command) {
            case "SET_STATE": {
                viewerClient.setModel(
                    message.data.mesh
                        ? {
                              vertices: new Float32Array(
                                  message.data.mesh.vertices
                              ),
                              faces: new Uint32Array(message.data.mesh.faces),
                          }
                        : undefined,
                    message.data.map
                        ? new Float32Array(message.data.map)
                        : undefined
                );
                vscodeApi.setState(viewerClient.getSerializableState());
                break;
            }
            default:
                break;
        }
    });

    window.onload = () => {
        onLoad();
        /*const meshDropdown: Dropdown = getDocElem("mesh-dropdown");
        const mapDropdown: Dropdown = getDocElem("map-dropdown");

        meshDropdown.onchange = () => {
            vscPostMessage({
                command: "SET_MESH",
                path: meshDropdown.value,
            });
        };

        mapDropdown.onchange = () => {
            vscPostMessage({
                command: "SET_MAP",
                path: mapDropdown.value,
            });
        };

        const meshSelectButton: Button = getDocElem("button-select-mesh");
        const mapSelectButton: Button = getDocElem("button-select-map");

        meshSelectButton.onclick = () => {
            vscPostMessage({
                command: "CHOOSE_MESH",
            });
        };
        mapSelectButton.onclick = () => {
            vscPostMessage({
                command: "CHOOSE_MAP",
            });
        };*/
    };
}

initWebview();
