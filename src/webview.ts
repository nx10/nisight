
import {
    Dropdown,
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
import { WebviewFrontendMessage, WebviewBackendMessage } from "./webview_message";

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
    var vscodeApi: WebviewApi<unknown>;
}

var vscodeApi = acquireVsCodeApi();

function vscPostMessage(message: WebviewFrontendMessage) {
    return vscodeApi.postMessage(message);
}

function initWebview() {

    window.addEventListener('message', (ev: MessageEvent<any>) => {
        const message: WebviewBackendMessage = ev.data;

        switch (message.command) {
            case 'SET_STATE':
                const viewerIFrame = document.getElementById('viewer-iframe') as HTMLIFrameElement;
                viewerIFrame.srcdoc = message.iframe_contents;
                break;
        
            default:
                break;
        }

        vscodeApi.postMessage(message);
    });

    window.onload = () => {
        const meshDropdown = document.getElementById('mesh-dropdown') as Dropdown;
        const mapDropdown = document.getElementById('map-dropdown') as Dropdown;

        meshDropdown.onchange = (ev) => {
            if (meshDropdown.value === 'Select file...') {
                vscPostMessage({
                    command: 'CHOOSE_MESH'
                });
            } else {
                vscPostMessage({
                    command: 'SET_MESH',
                    path: meshDropdown.value
                });
            }
        };

        mapDropdown.onchange = (ev) => {
            if (mapDropdown.value === 'Select file...') {
                vscPostMessage({
                    command: 'CHOOSE_MAP'
                });
            } else {
                vscPostMessage({
                    command: 'SET_MAP',
                    path: mapDropdown.value
                });
            }
        };
    }
}

initWebview();