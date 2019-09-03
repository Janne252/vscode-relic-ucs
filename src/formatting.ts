import * as vscode from 'vscode';
import { isInteger } from './validation';
import Config from './configuration';

export default class UCSTabFormatter implements vscode.Disposable {
	private readonly disposables: vscode.Disposable[] = [];
	private showSpacesConvertedNotification = true;

	constructor(config: Config) {
		this.disposables.push(vscode.workspace.onDidChangeTextDocument(this.onTextDocumentChanged));
	}

	onTextDocumentChanged = (e: vscode.TextDocumentChangeEvent) => {
		if (e.document.languageId !== 'ucs') {
			return;
		}

		const config = vscode.workspace.getConfiguration(undefined, e.document.uri);
		const tabSize = config.get('editor.tabSize');

		// if a singular edit was applied to the document
		if (e.contentChanges.length == 1) {
			const change = e.contentChanges[0];
			const text = change.text;

			// If text length doesn't match configured tab size or text isn't all spaces:
			// editor.insertSpaces is set to false or the edit originates from a clipboard paste, exit
			if (text.length != tabSize || text.split('').some(char => char != ' ')) {
				return;
			}

			const line = e.document.lineAt(change.range.start.line);
			const id = line.text.substring(0, change.range.start.character);

			// If the line starts with a valid ID
			if (isInteger(id)) {
				const edit = new vscode.WorkspaceEdit();
				
				// Replace the edit with a tab
				edit.replace(
					e.document.uri, 
					new vscode.Range(
						new vscode.Position(change.range.start.line, change.range.start.character),
						new vscode.Position(change.range.start.line, change.range.start.character + text.length),
					), 
					'\t'
				);
				
				vscode.workspace.applyEdit(edit);
						
				// Notify the user of the automatic change
				if (this.showSpacesConvertedNotification) {
					vscode.window.showInformationMessage<{title: string, id: string}>(
						`Automatically converted ${tabSize} spaces into a tab.`,
						{id: 'doNotShowAgain', title: `Don't show again`},
						{id: 'close', title: 'Dismiss'},
					).then(option => {
						if (option != null && option.id == 'doNotShowAgain') {
							this.showSpacesConvertedNotification = false;
						}
					});		
				}
			}
		}
	}

	dispose() {
		this.disposables.forEach(disposable => disposable.dispose());
	}
}