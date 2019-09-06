import * as vscode from 'vscode';
import { isInteger } from './validation';
import { hrtimeToSeconds, getRelativeFileName, combineDiagnostics } from './util';
import UCSConfig from './configuration';

/**
 * Provides diagnostics for a .ucs file.
 */
export default class UCSDiagnosticsProvider implements vscode.Disposable {
    private readonly diagnosticCollection: vscode.DiagnosticCollection;
    private readonly disposables: vscode.Disposable[] = [];
    private isProgressNotificationVisible = false;
    private config: UCSConfig;
    private processDocumentTimeout: NodeJS.Timeout | null = null;

    constructor(config: UCSConfig) {
        this.config = config;

        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ucs');

        // Listen for events that should trigger document validation
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(this.onOpenTextDocument),
            vscode.workspace.onDidChangeTextDocument(this.onDocumentTextChanged),
            this.config.onDidChange(this.onConfigChanged),
        );
           
        this.processAllWorkspaceDocuments();
    }

    private onOpenTextDocument = (e: vscode.TextDocument) => this.processDocument(e);
    private onDocumentTextChanged = (e: vscode.TextDocumentChangeEvent) => this.processDocument(e.document);
    private onConfigChanged = () => this.processAllWorkspaceDocuments();

    private processAllWorkspaceDocuments() {
        vscode.workspace.textDocuments.forEach(document => this.processDocument(document));
    }

    private processDocument(document: vscode.TextDocument) {
        if (document.languageId !== 'ucs') {
            return;
        }

        if (this.processDocumentTimeout != null) {
            clearTimeout(this.processDocumentTimeout);
        }

        this.processDocumentTimeout = setTimeout(() => {
            this.processDocumentTimeout = null;

            // Open, more than thousand lines: Show progress message
            if (!document.isClosed && document.lineCount > 1000 && this.isProgressNotificationVisible == false) {
                // Resolve a friendly file name
                let fileName = getRelativeFileName(document);
    
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    cancellable: false,
                    title: `[Large file] Processing ${fileName}...`
                }, () => new Promise((resolve, reject) => {
                    this.isProgressNotificationVisible = true;
    
                    setTimeout(() => {
                        this.diagnoseDocument(document);
                        resolve();
                        this.isProgressNotificationVisible = false;
                    }, 100);
                }));
            } else {
                this.diagnoseDocument(document);
            }
        }, 100);
    }

    private diagnoseDocument(document: vscode.TextDocument) {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split(/\r?\n/);
        const definedLocStringIds: {[key: string]: vscode.Range} = {};
        const definedLocStringMessages: {[key: string]: vscode.Range} = {};

        const duplicateIds: Record<string, vscode.DiagnosticRelatedInformation[]> = {};
        const duplicateMessages: Record<string, vscode.DiagnosticRelatedInformation[]> = {};
        const source = `UCS`;

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            // Check for empty lines. Allow last line of file to be empty.
            if (this.config.isEmptyLineWarningEnabled && line.length == 0) {
                if (lineIndex != lines.length - 1) {
                    diagnostics.push({
                        range: new vscode.Range(
                            new vscode.Position(lineIndex, 0),
                            new vscode.Position(lineIndex, line.length),
                        ),
                        message: 'Empty line.',
                        severity: vscode.DiagnosticSeverity.Warning,
                        source,
                    });
                }
                continue;
            }
            
            const tabIndex = line.indexOf('\t');
            
            // Check for lines that don't contain at least one tab character
            if (line.length > 0 && tabIndex == -1) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, line.length),
                    ),
                    message: 'Invalid LOCString: Missing tab character (required between ID number and the message)',
                    severity: vscode.DiagnosticSeverity.Error,
                    source,
                });
                continue;
            }

            const id = line.substring(0, tabIndex);
            const message = line.substring(tabIndex + 1);
            const normalizedMessage = message.trim();
            
            // Check for empty ID numbers
            if (line.length > 0 && id.length == 0) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, tabIndex),
                    ),
                    message: 'Invalid LOCString: Missing ID number.',
                    severity: vscode.DiagnosticSeverity.Error,
                    source,
                });
                continue;
            }
            
            // Check for non-numeric ID numbers
            if (line.length > 0 && !isInteger(id)) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, tabIndex),
                    ),
                    message: 'Invalid LOCString: Invalid ID number (must be an integer).',
                    severity: vscode.DiagnosticSeverity.Error,
                    source,
                });
                continue;
            }

            // Check for empty messages
            if (this.config.isEmptyMessageWarningEnabled && line.length > 0 && message.length == 0) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, line.length),
                    ),
                    message: 'Empty message.',
                    severity: vscode.DiagnosticSeverity.Warning,
                    source,
                });
                continue;
            }

            // Check for duplicate ID numbers
            if (id.length > 0 && definedLocStringIds[id] != null) {
                if (duplicateIds[id] == null) duplicateIds[id] = [];

                duplicateIds[id].push({
                    location: {
                        uri: document.uri,
                        range: new vscode.Range(
                            new vscode.Position(lineIndex, 0),
                            new vscode.Position(lineIndex, tabIndex),
                        ),
                    },
                    message: `Duplicate ID: "${id}"`,
                });
            }

            // Check for duplicate messages
            if (this.config.isDuplicateMessageWarningEnabled && normalizedMessage.length > 0 && definedLocStringMessages[normalizedMessage] != null) {
                if (duplicateMessages[normalizedMessage] == null) duplicateMessages[normalizedMessage] = [];

                duplicateMessages[normalizedMessage].push({
                    location: {
                        uri: document.uri,
                        range: new vscode.Range(
                            new vscode.Position(lineIndex, tabIndex + 1),
                            new vscode.Position(lineIndex, line.length),
                        )
                    },
                    message: `Duplicate message: "${normalizedMessage}"`,
                });
            }
            
            if (id.length > 0) {
                definedLocStringIds[id] = new vscode.Range(
                    new vscode.Position(lineIndex, 0),
                    new vscode.Position(lineIndex, tabIndex)
                );
            }
            
            if (normalizedMessage.length > 0) {
                definedLocStringMessages[normalizedMessage] = new vscode.Range(
                    new vscode.Position(lineIndex, tabIndex),
                    new vscode.Position(lineIndex, line.length)
                );
            }
        }

        for (const key in duplicateIds) {
            diagnostics.push(combineDiagnostics(duplicateIds[key], {source, severity: vscode.DiagnosticSeverity.Error}));
        }

        for (const key in duplicateMessages) {
            diagnostics.push(combineDiagnostics(duplicateMessages[key], {source}));
        }
        this.diagnosticCollection.set(document.uri, diagnostics);
    }


    public dispose() {
        this.disposables.forEach(item => item.dispose());
        this.diagnosticCollection.dispose();
    }
}