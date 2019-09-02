import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import UCSDiagnosticsProvider from './diagnostics';
import { isInteger } from './validation';

export const localize = nls.config({ messageFormat: nls.MessageFormat.file })();

class UCSTabFormatter implements vscode.Disposable {
	private readonly disposables: vscode.Disposable[] = [];
	private showSpacesConvertedNotification = true;

	constructor() {
		this.disposables.push(vscode.workspace.onDidChangeTextDocument(this.onTextDocumentChanged));
	}

	onTextDocumentChanged = (e: vscode.TextDocumentChangeEvent) => {
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
					const message = localize(
						'notifications.spacesAutoConvertedToTabs', 
						'Automatically converted {count} spaces into a tab.'
					)
						.replace('{count}', `${tabSize}`);

					vscode.window.showInformationMessage<{title: string, id: string}>(
						message,
						{id: 'doNotShowAgain', title: localize('actions.doNotShowAgain', "Don't show again")},
						{id: 'close', title: localize('actions.dismiss', "Dismiss")},
					).then(option => {
						if (option != null && option.id == 'doNotShowAgain') {
							this.showSpacesConvertedNotification = false;
						}
					});		
				}
			}
		}
	};

	dispose() {
		this.disposables.forEach(disposable => disposable.dispose());
	}
}
export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(new UCSDiagnosticsProvider());
	context.subscriptions.push(new UCSTabFormatter());
}

export function deactivate() {

}


// TODO use tabs for indentation instead of spaces
// See if it can be configured. If not, when someone adds 4 spaces = replace with tab if inserted after a number?
