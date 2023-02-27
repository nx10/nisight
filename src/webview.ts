
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

function initWebview() {

    window.addEventListener('message', (ev: MessageEvent<any>) => {
        const message = ev.data;

        vscodeApi.postMessage(message);
    });

    window.onload = () => {
        const meshDropdown = document.getElementById('mesh-dropdown') as Dropdown;
        const mapDropdown = document.getElementById('map-dropdown') as Dropdown;

        meshDropdown.onchange = (ev) => {
            vscodeApi.postMessage('Mesh changed: ' + meshDropdown.value);
        };

        mapDropdown.onchange = (ev) => {
            vscodeApi.postMessage('Map changed: ' + mapDropdown.value);
        };
    }
}

initWebview();