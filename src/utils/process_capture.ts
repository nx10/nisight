import { spawn } from 'child_process';
import { logMessage } from '../utils/logging';

interface ProcessOutput {
    code: number | null
    message: string
}

export function process_capture(command: string, args?: readonly string[] | undefined, logOutput?: boolean): Promise<ProcessOutput> {
    console.log(command);
    if (args)
        console.log(args);
    
    return new Promise<ProcessOutput>(
        function (
            resolve: (value: ProcessOutput | PromiseLike<ProcessOutput>) => void,
            reject: (reason?: any) => void
        ) {
            const pythonProcess = spawn(command, args);

            let bufferOut = '';

            pythonProcess.stdout.on('data', (data) => {
                if (logOutput) {
                    logMessage(data.toString(), '');
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
                if (logOutput) {
                    logMessage(err.toString(), '');
                }
                reject(err);
            });
        }
    );
}