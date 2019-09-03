import * as vscode from 'vscode';
import {localize} from './extension';
import { isInteger } from './validation';

/**
 * Provides diagnostics for a .ucs file.
 */
export default class UCSDiagnosticsProvider implements vscode.Disposable {
    private readonly diagnosticCollection: vscode.DiagnosticCollection;
    private readonly disposables: vscode.Disposable[] = [];
    private isProgressNotificationVisible = false;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('ucs');

        // Listen for events that should trigger document validation
        this.disposables.push(
            vscode.workspace.onDidOpenTextDocument(this.onOpenTextDocument),
            // TODO this event seems to fire twice on first text editor edit
            vscode.workspace.onDidChangeTextDocument(this.onDocumentTextChanged),
        );

        // Process documents that are already open
        vscode.workspace.textDocuments.forEach(document => this.processDocument(document, 'initial'));
    }

    private onOpenTextDocument = (e: vscode.TextDocument) => this.processDocument(e, 'onDidOpenTextDocument');
    private onDocumentTextChanged = (e: vscode.TextDocumentChangeEvent) => this.processDocument(e.document, 'onDidChangeTextDocument');

    private processDocument(document: vscode.TextDocument, eventName: string) {
        if (document.languageId !== 'ucs') {
            return;
        }

        console.log(`processDocument: ${eventName}`);

        // Open, more than thousand lines: Show progress message
        if (!document.isClosed && document.lineCount > 1000 && this.isProgressNotificationVisible == false) {
            // Resolve a friendly file name
            let fileName = document.fileName;
            for (const folder of vscode.workspace.workspaceFolders || []) {
                if (document.uri.path.startsWith(folder.uri.path)) {
                    fileName = document.uri.path.substring(folder.uri.path.length);
                    if (fileName.startsWith('/')) {
                        fileName = fileName.substring(1);
                    }
                    break;
                }
            }

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
                title: localize('notifications.processingLargeFile', '[Large file] Processing {file}...').replace(
                    '{file}', fileName,
                ),

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
    }

    private diagnoseDocument(document: vscode.TextDocument) {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        const definedLocStringIds: {[key: string]: vscode.Range} = {};
        const definedLocStringMessages: {[key: string]: vscode.Range} = {};

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
           
            // Check for empty lines. Allow last line of file to be empty.
            if (line.length == 0) {
                if (lineIndex != lines.length - 1) {
                    diagnostics.push({
                        range: new vscode.Range(
                            new vscode.Position(lineIndex, 0),
                            new vscode.Position(lineIndex, line.length),
                        ),
                        message: localize('diagnostics.warning.emptyLine', 'Empty line.'),
                        
                        severity: vscode.DiagnosticSeverity.Warning,
                    });
                }
                continue;
            }
            
            let tabIndex = line.indexOf('\t');
            
            // Check for lines that don't contain at least one tab character
            if (tabIndex == -1) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, line.length),
                    ),
                    message: localize('diagnostics.error.invalidLocString', 'Invalid LOCString: Missing tab character (required between ID number and the message)'),
                    
                    severity: vscode.DiagnosticSeverity.Error,
                });
                continue;
            }

            const id = line.substring(0, tabIndex);
            const message = line.substring(tabIndex + 1);
            const normalizedMessage = message.trim().toLowerCase();
            
            // Check for empty ID numbers
            if (id.length == 0) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, tabIndex),
                    ),
                    message: localize('diagnostics.error.missingLocStringId', 'Invalid LOCString: Missing ID number.'),
                    
                    severity: vscode.DiagnosticSeverity.Error,
                });
                continue;
            }
            
            // Check for non-numeric ID numbers
            if (!isInteger(id)) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, tabIndex),
                    ),
                    message: localize('diagnostics.error.invalidLocStringId', 'Invalid LOCString: Invalid ID number (must be an integer).'),
                    
                    severity: vscode.DiagnosticSeverity.Error,
                });
                continue;
            }

            // Check for empty messages
            if (message.trim().length == 0) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, line.length),
                    ),
                    message: localize('diagnostics.warning.emptyMessage', 'Empty message.'),
                    
                    severity: vscode.DiagnosticSeverity.Warning,
                });
                continue;
            }

            // Check for duplicate ID numbers
            if (definedLocStringIds[id] != null) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, 0),
                        new vscode.Position(lineIndex, tabIndex),
                    ),
                    message: localize('diagnostics.error.duplicateLocStringId', 'Duplicate ID (first occurrance on line {line}).')
                        .replace('{line}', `${lineIndex}`)
                    ,
                    
                    severity: vscode.DiagnosticSeverity.Error,
                });
            }

            // Check for duplicate messages
            if (definedLocStringMessages[normalizedMessage] != null) {
                diagnostics.push({
                    range: new vscode.Range(
                        new vscode.Position(lineIndex, tabIndex + 1),
                        new vscode.Position(lineIndex, line.length),
                    ),
                    message: localize('diagnostics.warning.duplicateLocStringMessage', 'Duplicate message (first occurrance on line {line}).')
                        .replace('{line}', `${lineIndex}`)
                    ,
                    
                    severity: vscode.DiagnosticSeverity.Warning,
                });
            }

            definedLocStringIds[id] = new vscode.Range(
                new vscode.Position(lineIndex, 0),
                new vscode.Position(lineIndex, tabIndex)
            );

            definedLocStringMessages[normalizedMessage] = new vscode.Range(
                new vscode.Position(lineIndex, tabIndex),
                new vscode.Position(lineIndex, line.length)
            );
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    public dispose() {
        this.disposables.forEach(item => item.dispose());
        this.diagnosticCollection.dispose();
    }
}