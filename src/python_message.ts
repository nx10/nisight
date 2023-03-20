export type PythonMessage =
    | {
          status: "OK";
          content: {
            mesh: {vertices: number[], faces: number[]},
            map: number[] | null
        };
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
