import * as vscode from 'vscode';
import { positionFromIndex, isInsideCommentOrString, findMatchingBrace } from '../utils/textUtils';
import { DuplicateBlock, LanguageParser } from './types';

/**
 * Parser para encontrar y fusionar duplicados en código CSS, SCSS y Less.
 */
export const cssParser: LanguageParser = {
    /**
     * Encuentra bloques de selectores CSS duplicados en un texto.
     * @param text El texto completo del documento.
     * @param editor El editor de texto activo.
     * @returns Un array de bloques duplicados encontrados.
     */
    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {
        const duplicates: DuplicateBlock[] = [];
        const blocks = new Map<string, vscode.Range[]>();

        let currentIndex = 0;
        // Bucle principal que recorre el texto para encontrar bloques CSS.
        while (currentIndex < text.length) {
            // Encuentra la próxima llave de apertura `{` que indica el inicio de un bloque.
            const openBraceIndex = text.indexOf('{', currentIndex);
            if (openBraceIndex === -1) {break;}

            // Ignora la llave si está dentro de un comentario o una cadena.
            if (isInsideCommentOrString(text, openBraceIndex)) {
                currentIndex = openBraceIndex + 1;
                continue;
            }

            // Encuentra la llave de cierre `}` correspondiente.
            const closeBraceIndex = findMatchingBrace(text, openBraceIndex, '{', '}');
            if (closeBraceIndex === -1) {
                currentIndex = openBraceIndex + 1;
                continue;
            }

            // Retrocede desde la llave de apertura para encontrar el inicio del selector.
            let selectorStart = openBraceIndex - 1;
            while (selectorStart > 0) {
                const char = text[selectorStart];
                if (char === '}' || char === ';' || char === '\n') {
                    selectorStart++;
                    break;
                }
                selectorStart--;
            }

            selectorStart = Math.max(0, selectorStart);

            // Extrae el nombre del selector.
            const selector = text.substring(selectorStart, openBraceIndex).trim();

            // Ignora selectores vacíos o que son parte de comentarios.
            if (!selector || selector.startsWith('/*') || selector.startsWith('*')) {
                currentIndex = closeBraceIndex + 1;
                continue;
            }

            // Crea un rango que abarca todo el bloque CSS (selector y cuerpo).
            const range = new vscode.Range(
                positionFromIndex(text, selectorStart),
                positionFromIndex(text, closeBraceIndex + 1)
            );

            // Almacena el rango del bloque, agrupado por nombre de selector.
            if (!blocks.has(selector)) {
                blocks.set(selector, []);
            }
            blocks.get(selector)!.push(range);

            // Avanza el índice de búsqueda al final del bloque actual.
            currentIndex = closeBraceIndex + 1;
        }

        // Itera sobre los bloques agrupados para identificar los que tienen más de una ocurrencia.
        for (const [selector, ranges] of blocks.entries()) {
            if (ranges.length > 1) {
                duplicates.push({
                    name: selector,
                    ranges,
                    type: 'css',
                    language: 'css'
                });
            }
        }

        return duplicates;
    },

    /**
     * Fusiona un conjunto de rangos de bloques duplicados, conservando el contenido del último bloque.
     * @param editor El editor de texto activo.
     * @param ranges Los rangos de los bloques duplicados a fusionar.
     * @returns El contenido del último bloque, que se usará para reemplazar a los demás.
     */
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {
        // Devuelve el contenido del último rango, que representa la versión más reciente del bloque.
        return editor.document.getText(ranges[ranges.length - 1]);
    }
};
