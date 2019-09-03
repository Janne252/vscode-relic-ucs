import * as vscode from 'vscode';
import UCSDiagnosticsProvider from './diagnostics';
import UCSTabFormatter from './formatting';
import Config from './configuration';

export async function activate(context: vscode.ExtensionContext) {
	const config = new Config();
	
	context.subscriptions.push(new UCSDiagnosticsProvider(config));
	context.subscriptions.push(new UCSTabFormatter(config));
	context.subscriptions.push(config);
}

export function deactivate() {

}
