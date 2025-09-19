import * as vscode from 'vscode';
import { getParserForLanguage } from './parsers';
import { mergeDuplicates } from './merge';

/**
 * Activa la extensión Merge Helper.
 * Esta función se llama cuando la extensión es activada por primera vez.
 * @param context El contexto de la extensión, proporcionado por VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Merge Helper activated!');

    /**
     * Handles the process of merging duplicates for a specific language.
     * @param languageId The identifier of the programming language (e.g., 'javascript', 'css').
     */
    const handleMerge = async (languageId: string) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const document = editor.document;
        const text = document.getText();

        console.log(`=== STARTING ANALYSIS FOR: ${languageId} ===`);
        console.log(`File: ${document.fileName}`);
        console.log(`Total lines: ${document.lineCount}`);

        try {
            // Gets the appropriate parser for the current language.
            const parser = getParserForLanguage(languageId);
            // Finds all duplicate blocks in the text.
            const duplicates = parser.findDuplicates(text, editor);

            console.log('=== ANALYSIS RESULTS ===');
            console.log(`Duplicates found: ${duplicates.length}`);

            if (duplicates.length === 0) {
                vscode.window.showInformationMessage('No duplicates found');
                return;
            }

            // Performs the merge of the found duplicates.
            const result = await mergeDuplicates(editor, duplicates, parser);

            vscode.window.showInformationMessage(
                `Merge completed. ${result.merged} blocks merged.`
            );

        } catch (error) {
            console.error('DETAILED ERROR:', error);
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    };

    // Defines the commands that the extension will register.
    const commands = [
        vscode.commands.registerCommand('merge-helper.merge-javascript', () => handleMerge('javascript')),
        vscode.commands.registerCommand('merge-helper.merge-css', () => handleMerge('css')),
        vscode.commands.registerCommand('merge-helper.merge-python', () => handleMerge('python'))
    ];

    // Iterates over the commands and adds them to the extension's context so they are available.
    commands.forEach(command => context.subscriptions.push(command));
}

/**
 * Deactivates the extension.
 * This function is called when the extension is deactivated.
 */
export function deactivate() {}