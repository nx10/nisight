export function windowsCompatiblePath(path: string): string {
    if (process.platform === 'win32') {
        // Strip leading forward slashes
        return path.replace(/^\/+/, '');
    }
    
    return path;
}