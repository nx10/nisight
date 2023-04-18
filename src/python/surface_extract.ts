import vscode from "vscode";
import surface_extract_py from "../python/scripts/surface_extract.py";
import { PythonMessageError, PythonMessageSurface, PythonMessageSurfaceContent } from "../python_message";
import { getOutputConsole } from "../utils/logging";
import { getUri } from "../utils/path_utils";
import { processCapture } from "../utils/process_capture";
import { getVenvInterpreter } from "../utils/python_environment";

const SHOW_OUTPUT_CONSOLE_ACTION = "Show output console";


export async function mapExtract(
    extensionUri: vscode.Uri,
    uri: vscode.Uri,
) {
    const data = await surfaceExtract(extensionUri, undefined, uri);
    return data?.map ? data.map : null;
}

export async function meshExtract(
    extensionUri: vscode.Uri,
    uri: vscode.Uri,
) {
    const data = await surfaceExtract(extensionUri, uri, undefined);
    return data?.mesh ? data.mesh : null;
}

export async function surfaceExtract(
    extensionUri: vscode.Uri,
    fileMesh?: vscode.Uri,
    fileMap?: vscode.Uri
): Promise<PythonMessageSurfaceContent | undefined> {
    const pythonInterpreter = getVenvInterpreter();
    if (pythonInterpreter === undefined) {
        vscode.window.showErrorMessage("Python environment not found.");
        return;
    }

    const pyPath = getUri(extensionUri, ["dist", surface_extract_py]).fsPath;
    const args = [pyPath];

    if (fileMesh) {
        args.push("--mesh", fileMesh.fsPath);
    }

    if (fileMap) {
        args.push("--map", fileMap.fsPath);
    }

    const processOutput = await processCapture(pythonInterpreter, args);

    if (processOutput.code !== 0) {
        console.error(
            `Python process had non-zero exit code. Message body: '${processOutput.message}'`
        );
        return;
    }

    type PyMsg = PythonMessageError | PythonMessageSurface;

    let msg: PyMsg;
    try {
        msg = JSON.parse(processOutput.message) as PyMsg;
    } catch (error) {
        console.error(error);
        return;
    }

    if (msg.status === "ERROR") {
        const output = getOutputConsole();

        output.append(
            `Python error '${msg.content.exception}' occured: ${msg.content.message}\n`
        );
        vscode.window
            .showErrorMessage(
                `NiSight: Python error ${msg.content.exception} occured. Show the output console for details...`,
                SHOW_OUTPUT_CONSOLE_ACTION
            )
            .then((choice) => {
                if (choice === SHOW_OUTPUT_CONSOLE_ACTION) {
                    output.show();
                }
            });
        return;
    }

    return msg.content;
}
