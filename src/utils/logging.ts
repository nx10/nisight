import * as vscode from 'vscode';

const SHOW_OUTPUT_CONSOLE_ACTION = 'Show output console';
let outputConsole: vscode.OutputChannel;

interface PythonExceptionMessage {
    exception: string
    message: string
}

export function getOutputConsole() {
    if (outputConsole) {
        return outputConsole;
    }
    
    outputConsole = vscode.window.createOutputChannel('NiSight');
    return outputConsole;
}

export function logMessage(message: string, eol: string = '\n') {
    const output = getOutputConsole();
    output.append(message + eol);
}

export function logPythonException(exceptionContent: PythonExceptionMessage) {
    const output = getOutputConsole();

    output.append(`Python error '${exceptionContent.exception}' occured: ${exceptionContent.message}\n`);
    vscode.window.showErrorMessage(`NiSight: Python error ${exceptionContent.exception} occured. Show the output console for details...`, SHOW_OUTPUT_CONSOLE_ACTION).then(choice => {
        if (choice === SHOW_OUTPUT_CONSOLE_ACTION) {
            output.show();
        }
    });
}