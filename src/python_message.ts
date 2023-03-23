
export type PythonMessage<TStatus, TContent> = {
    status: TStatus;
    content: TContent;
};

export type PythonMessageErrorContent = {
    exception: string;
    message: string;
};

export type PythonMessageError = PythonMessage<"ERROR", PythonMessageErrorContent>;

export type PythonMessageSurfaceContent = {
    mesh: {vertices: number[], faces: number[]} | null,
    map: number[] | null
};

export type PythonMessageSurface = PythonMessage<"OK", PythonMessageSurfaceContent>;

