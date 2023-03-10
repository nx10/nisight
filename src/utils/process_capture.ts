import { spawn } from "child_process";
import { logMessage } from "../utils/logging";

interface ProcessOutput {
    code: number | null;
    message: string;
}

export function processCapture(
    command: string,
    args?: readonly string[] | undefined,
    logOutput?: boolean
): Promise<ProcessOutput> {
    console.log(`COMMAND: ${command} ${args ? args.join(" ") : ""}`);

    return new Promise<ProcessOutput>(function (
        resolve: (value: ProcessOutput | PromiseLike<ProcessOutput>) => void,
        reject: (reason?: unknown) => void
    ) {
        const pythonProcess = spawn(command, args);

        let bufferOut = "";

        pythonProcess.stdout.on("data", (data) => {
            if (logOutput) {
                logMessage(data.toString(), "");
            }
            bufferOut += data;
        });

        pythonProcess.on("close", (code) => {
            resolve({
                code: code,
                message: bufferOut,
            });
        });

        process.on("error", function (err) {
            if (logOutput) {
                logMessage(err.toString(), "");
            }
            reject(err);
        });
    });
}
