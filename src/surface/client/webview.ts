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

import { loadScene } from "./surfaceclient";

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

function getDocElem<T extends HTMLElement>(id: string) {
    return document.getElementById(id) as T;
}

function initWebview() {
    window.addEventListener("message", (ev: MessageEvent<unknown>) => {
        const message = ev.data as WebviewBackendMessage;

        switch (message.command) {
            case "SET_STATE": {
                const meshDropdown: Dropdown = getDocElem("mesh-dropdown");
                const mapDropdown: Dropdown = getDocElem("map-dropdown");

                if (!message.data.mesh) return;

                loadScene(
                    message.data.mesh,
                    message.data.map ?? undefined
                );

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

                break;
            }
            default:
                break;
        }

        vscodeApi.postMessage(message);
    });

    window.onload = () => {
        const meshDropdown: Dropdown = getDocElem("mesh-dropdown");
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
        };
    };
}

initWebview();
