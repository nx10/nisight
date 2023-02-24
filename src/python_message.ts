export type PythonMessage = {
    status: 'OK'
    content: string
} | {
    status: 'ERROR'
    content: {
        exception: string
        message: string
    }
}

export function parse_python_message(message_json: string): PythonMessage {
    return JSON.parse(message_json) as PythonMessage;
}