import * as vscode from 'vscode';
import { getParserForLanguage } from './parsers';
import { mergeDuplicates } from './merge';

/**
 * Activa la extensión Merge Helper.
 * Esta función se llama cuando la extensión es activada por primera vez.
 * @param context El contexto de la extensión, proporcionado por VS Code.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Merge Helper activado!');

    /**
     * Maneja el proceso de fusión de duplicados para un lenguaje específico.
     * @param languageId El identificador del lenguaje de programación (ej. 'javascript', 'css').
     */
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
            // Obtiene el parser adecuado para el lenguaje actual.
            const parser = getParserForLanguage(languageId);
            // Encuentra todos los bloques duplicados en el texto.
            const duplicates = parser.findDuplicates(text, editor);

            console.log('=== RESULTADOS DEL ANÁLISIS ===');
            console.log(`Duplicados encontrados: ${duplicates.length}`);

            if (duplicates.length === 0) {
                vscode.window.showInformationMessage('No se encontraron duplicados');
                return;
            }

            // Realiza la fusión de los duplicados encontrados.
            const result = await mergeDuplicates(editor, duplicates, parser);

            vscode.window.showInformationMessage(
                `Merge completado. ${result.merged} bloques fusionados.`
            );

        } catch (error) {
            console.error('ERROR DETALLADO:', error);
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    };

    // Define los comandos que la extensión registrará.
    const commands = [
        vscode.commands.registerCommand('merge-helper.merge-javascript', () => handleMerge('javascript')),
        vscode.commands.registerCommand('merge-helper.merge-css', () => handleMerge('css')),
        vscode.commands.registerCommand('merge-helper.merge-python', () => handleMerge('python'))
    ];

    // Itera sobre los comandos y los agrega al contexto de la extensión para que estén disponibles.
    commands.forEach(command => context.subscriptions.push(command));
}

/**
 * Desactiva la extensión.
 * Esta función se llama cuando la extensión es desactivada.
 */
export function deactivate() {}
