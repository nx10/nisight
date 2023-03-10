export type PythonMessage =
    | {
          status: "OK";
          content: string;
      }
    | {
          status: "ERROR";
          content: {
              exception: string;
              message: string;
          };
      };

export function parsePythonMessage(messageJson: string): PythonMessage {
    return JSON.parse(messageJson) as PythonMessage;
}
