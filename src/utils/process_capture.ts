import { spawn } from 'child_process';
import * as vscode from 'vscode';

interface ProcessOutput {
    code: number | null
    message: string
}

export function process_capture(command: string, args?: readonly string[] | undefined, outputConsole?: vscode.OutputChannel): Promise<ProcessOutput> {
    return new Promise<ProcessOutput>(
        function (
            resolve: (value: ProcessOutput | PromiseLike<ProcessOutput>) => void,
            reject: (reason?: any) => void
        ) {
            outputConsole?.append("hello world");

            const pythonProcess = spawn(command, args);

            let bufferOut = '';

            pythonProcess.stdout.on('data', (data) => {
                if (outputConsole) {
                    outputConsole.append(data.toString());
                }
                bufferOut += data;
            });

            pythonProcess.on('close', (code) => {
                resolve({
                    code: code,
                    message: bufferOut
                });
            });

            process.on('error', function (err) {
                if (outputConsole) {
                    outputConsole.append(err.toString());
                }
                reject(err);
            });
        }
    );
}