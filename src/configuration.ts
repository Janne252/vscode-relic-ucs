import * as vscode from 'vscode';

export default class UCSConfig implements vscode.Disposable {
    private readonly disposables: vscode.Disposable[] = [];
    private readonly onDidChangeCallbacks: (() => void)[] = [];

    private config = {
        isEmptyMessageWarningEnabled: true,
        isDuplicateMessageWarningEnabled: true,
        isEmptyLineWarningEnabled: true,
    };
    
    private isEditorInsertSpacesWarningEnabled = true;

    get isEmptyMessageWarningEnabled() { return this.config.isEmptyMessageWarningEnabled; }
    get isDuplicateMessageWarningEnabled() { return this.config.isDuplicateMessageWarningEnabled; }
    get isEmptyLineWarningEnabled() { return this.config.isEmptyLineWarningEnabled; }

    constructor() {
        this.disposables.push(vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration));
        this.loadConfiguration();
    }

    private onDidChangeConfiguration = (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('ucs') || e.affectsConfiguration('editor.insertSpaces')) {
            this.loadConfiguration();
            for (const callback of this.onDidChangeCallbacks) {
                callback();
            }
        }
    };

    private async loadConfiguration() {
        const config = vscode.workspace.getConfiguration('ucs');
        this.config.isEmptyMessageWarningEnabled = config.get(
            'diagnostics.warnings.emptyMessage', 
            this.config.isEmptyMessageWarningEnabled
        ) as boolean;

        this.config.isDuplicateMessageWarningEnabled = config.get(
            'diagnostics.warnings.duplicateMessage', 
            this.config.isDuplicateMessageWarningEnabled
        ) as boolean;

        this.config.isEmptyLineWarningEnabled = config.get(
            'diagnostics.warnings.emptyLine', 
            this.config.isEmptyLineWarningEnabled
        ) as boolean;
    }

    onDidChange(callback: () => void) {
        this.onDidChangeCallbacks.push(callback);
        const listener = new vscode.Disposable(() => {
            this.onDidChangeCallbacks.splice(this.onDidChangeCallbacks.indexOf(callback), 1);
        });
        this.disposables.push(listener);
        return listener;
    }

    dispose() {
        this.disposables.forEach(disposable => disposable.dispose());
    }
}
