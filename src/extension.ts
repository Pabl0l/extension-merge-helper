import * as vscode from 'vscode';
import { getParserForLanguage } from './parsers';
import { mergeDuplicates } from './merge';

export function activate(context: vscode.ExtensionContext) {
    console.log('Merge Helper activado!');

    // Función común para manejar el merge
    const handleMerge = async (languageId: string) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No hay editor activo');
            return;
        }

        const document = editor.document;
        const text = document.getText();

        console.log(`=== INICIANDO ANÁLISIS PARA: ${languageId} ===`);
        console.log(`Archivo: ${document.fileName}`);
        console.log(`Total de líneas: ${document.lineCount}`);

        try {
            const parser = getParserForLanguage(languageId);
            const duplicates = parser.findDuplicates(text, editor);

            console.log('=== RESULTADOS DEL ANÁLISIS ===');
            console.log(`Duplicados encontrados: ${duplicates.length}`);

            if (duplicates.length === 0) {
                vscode.window.showInformationMessage('No se encontraron duplicados');
                return;
            }

            const result = await mergeDuplicates(editor, duplicates, parser);

            vscode.window.showInformationMessage(
                `Merge completado. ${result.merged} bloques fusionados.`
            );

        } catch (error) {
            console.error('ERROR DETALLADO:', error);
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    };

    // Registrar comandos para cada lenguaje
    const commands = [
        vscode.commands.registerCommand('merge-helper.merge-javascript', () => handleMerge('javascript')),
        vscode.commands.registerCommand('merge-helper.merge-css', () => handleMerge('css')),
        vscode.commands.registerCommand('merge-helper.merge-html', () => handleMerge('html')),
        vscode.commands.registerCommand('merge-helper.merge-java', () => handleMerge('java')),
        vscode.commands.registerCommand('merge-helper.merge-python', () => handleMerge('python')),
        vscode.commands.registerCommand('merge-helper.merge-php', () => handleMerge('php'))
    ];

    // Agregar todos los comandos al contexto
    commands.forEach(command => context.subscriptions.push(command));
}

export function deactivate() {}