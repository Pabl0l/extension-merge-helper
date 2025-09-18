import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './types';

/**
 * Un parser genérico que se utiliza cuando no hay un parser específico para el lenguaje actual.
 * No realiza ninguna acción de búsqueda de duplicados.
 */
export const genericParser: LanguageParser = {
    /**
     * Devuelve un array vacío, ya que este parser no detecta duplicados.
     * @returns Un array vacío.
     */
    findDuplicates: (): DuplicateBlock[] => [],

    /**
     * Devuelve el contenido del último rango proporcionado. Aunque no se utiliza activamente
     * con `findDuplicates` vacío, implementa la interfaz requerida.
     * @param editor El editor de texto activo.
     * @param ranges Un array de rangos.
     * @returns El texto del último rango.
     */
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {
        return editor.document.getText(ranges[ranges.length - 1]);
    }
};