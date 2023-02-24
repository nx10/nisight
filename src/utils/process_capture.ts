import { spawn } from 'child_process';

interface ProcessOutput {
    code: number | null
    message: string
}

export function process_capture(command: string, args?: readonly string[] | undefined) {
    return new Promise<ProcessOutput>(
        function (
            resolve: (value: ProcessOutput | PromiseLike<ProcessOutput>) => void,
            reject: (reason?: any) => void
        ) {

            const pythonProcess = spawn(command, args);

            let bufferOut = '';

            pythonProcess.stdout.on('data', (data) => {
                bufferOut += data;
            });

            pythonProcess.on('close', (code) => {
                resolve({
                    code: code,
                    message: bufferOut
                });
            });

            process.on('error', function (err) {
                reject(err);
            });
        });

}