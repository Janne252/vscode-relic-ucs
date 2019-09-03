import * as vscode from 'vscode';


export function hrtimeToSeconds(hrtime: [number, number], precision = 6) {
    return (hrtime[0] + (hrtime[1] / 1e9)).toFixed(6);
}

export function getRelativeFileName(document: vscode.TextDocument) {
    let fileName = document.fileName;
    // Iterate over workspace folders to figure out where it lives 
    for (const folder of vscode.workspace.workspaceFolders || []) {
        if (document.uri.path.startsWith(folder.uri.path)) {
            // Remove workspace folder root path from the file path
            fileName = document.uri.path.substring(folder.uri.path.length);
            // Clear additional / prefix
            if (fileName.startsWith('/')) {
                fileName = fileName.substring(1);
            }
            break;
        }
    }
     
    return fileName;
}

/**
 * Combines a collection of diagnostic information into a single diagnostics item.
 * Last diagnostic info becomes the visible diagnostic item and all the rest will be included as related information.
 * @param diagnostics 
 * @param options Addiotnal options to pass on to the root diagnostic item.
 */
export function combineDiagnostics(
    diagnostics: vscode.DiagnosticRelatedInformation[], 
    options?: Partial<Omit<vscode.Diagnostic, 'range' | 'message' | 'relatedInformation'>>
): vscode.Diagnostic {
    const primary = diagnostics[diagnostics.length - 1];
    return {
        range: primary.location.range,
        message: primary.message,
        relatedInformation: diagnostics.slice(0, diagnostics.length - 1),
        severity: vscode.DiagnosticSeverity.Warning,
        ...options,
    }
}
