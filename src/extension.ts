import * as vscode from 'vscode';
import UCSDiagnosticsProvider from './diagnostics';
import UCSConfig from './configuration';

export async function activate(context: vscode.ExtensionContext) {
	const config = new UCSConfig();
	
	context.subscriptions.push(new UCSDiagnosticsProvider(config));
	context.subscriptions.push(config);
}

export function deactivate() {

}
