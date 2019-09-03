import * as vscode from 'vscode';

export default class Config implements vscode.Disposable {
    private readonly disposables: vscode.Disposable[] = [];
    private readonly onDidChangeCallbacks: (() => void)[] = [];

    private config = {
        ignoreEmptyMessages: false,
        ignoreDuplicateMessages: false,
        ignoreEmptyLines: false,
    };

    get ignoreEmptyMessages() { return this.config.ignoreEmptyMessages; }
    get ignoreDuplicateMessages() { return this.config.ignoreDuplicateMessages; }
    get ignoreEmptyLines() { return this.config.ignoreEmptyLines; }

    constructor() {
        this.disposables.push(vscode.workspace.onDidChangeConfiguration(this.onDidChangeConfiguration));
        this.loadConfiguration();
    }

    private onDidChangeConfiguration = (e: vscode.ConfigurationChangeEvent) => {
        if (e.affectsConfiguration('ucs')) {
            this.loadConfiguration();
            for (const callback of this.onDidChangeCallbacks) {
                callback();
            }
        }
    };

    private loadConfiguration() {
        const config = vscode.workspace.getConfiguration('ucs');
        this.config.ignoreEmptyMessages = config.get('ignoreEmptyMessages', false);
        this.config.ignoreDuplicateMessages = config.get('ignoreDuplicateMessages', false);
        this.config.ignoreEmptyLines = config.get('ignoreEmptyLines') as boolean;
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
