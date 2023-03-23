import vscode from "vscode";

export function isDarkMode() {
    vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
        vscode.window.activeColorTheme.kind ===
            vscode.ColorThemeKind.HighContrast;
}
