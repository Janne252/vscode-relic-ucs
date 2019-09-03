import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import UCSDiagnosticsProvider from './diagnostics';
import UCSTabFormatter from './formatting';

export const localize = nls.config({ messageFormat: nls.MessageFormat.file })();

export async function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(new UCSDiagnosticsProvider());
	context.subscriptions.push(new UCSTabFormatter());
}

export function deactivate() {

}
