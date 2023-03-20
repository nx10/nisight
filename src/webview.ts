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
} from "./webview_message";

import { loadScene } from "./surface/surfaceclient";

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

declare global {
    // eslint-disable-next-line no-var
    var vscodeApi: WebviewApi<unknown>;
}

// eslint-disable-next-line no-var
var vscodeApi = acquireVsCodeApi();

function vscPostMessage(message: WebviewFrontendMessage) {
    return vscodeApi.postMessage(message);
}

function initWebview() {
    window.addEventListener("message", (ev: MessageEvent<unknown>) => {
        const message = ev.data as WebviewBackendMessage;

        switch (message.command) {
            case "SET_STATE": {
                const viewerIFrame = document.getElementById(
                    "viewer-iframe"
                ) as HTMLIFrameElement;
                const meshDropdown = document.getElementById(
                    "mesh-dropdown"
                ) as Dropdown;
                const mapDropdown = document.getElementById(
                    "map-dropdown"
                ) as Dropdown;
                loadScene(
                    message.iframe_contents.mesh,
                    message.iframe_contents.map ?? undefined
                );

                mapDropdown.innerHTML = "";
                message.select_map_entries.map((e) => {
                    const opt = document.createElement(
                        "vscode-option"
                    ) as Option;
                    opt.value = e.value;
                    opt.innerHTML = e.label;
                    mapDropdown.appendChild(opt);
                });

                meshDropdown.innerHTML = "";
                message.select_mesh_entries.map((e) => {
                    const opt = document.createElement(
                        "vscode-option"
                    ) as Option;
                    opt.value = e.value;
                    opt.innerHTML = e.label;
                    meshDropdown.appendChild(opt);
                });

                break;
            }
            default:
                break;
        }

        vscodeApi.postMessage(message);
    });

    window.onload = () => {
        const meshDropdown = document.getElementById(
            "mesh-dropdown"
        ) as Dropdown;
        const mapDropdown = document.getElementById("map-dropdown") as Dropdown;

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

        const meshSelectButton = document.getElementById(
            "button-select-mesh"
        ) as Button;
        const mapSelectButton = document.getElementById(
            "button-select-map"
        ) as Button;

        meshSelectButton.onclick = () => {
            vscPostMessage({
                command: "CHOOSE_MESH",
            });
        };
        mapSelectButton.onclick = () => {
            vscPostMessage({
                command: "CHOOSE_MAP",
            });
        };
    };
}

initWebview();
