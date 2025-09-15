import * as vscode from 'vscode';
import { positionFromIndex, isInsideCommentOrString, findMatchingBrace } from '../utils/textUtils';
import { DuplicateBlock, LanguageParser } from './types';

export const cssParser: LanguageParser = {
    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {
        const duplicates: DuplicateBlock[] = [];
        const blocks = new Map<string, vscode.Range[]>();

        let currentIndex = 0;
        while (currentIndex < text.length) {
            // Encontrar la próxima llave de apertura
            const openBraceIndex = text.indexOf('{', currentIndex);
            if (openBraceIndex === -1) {break;}

            // Saltar si está dentro de comentario o string
            if (isInsideCommentOrString(text, openBraceIndex)) {
                currentIndex = openBraceIndex + 1;
                continue;
            }

            // Encontrar la llave de cierre correspondiente
            const closeBraceIndex = findMatchingBrace(text, openBraceIndex, '{', '}');
            if (closeBraceIndex === -1) {
                currentIndex = openBraceIndex + 1;
                continue;
            }

            // Encontrar el inicio del selector (retroceder hasta el último ; o } o inicio del documento)
            let selectorStart = openBraceIndex - 1;
            while (selectorStart > 0) {
                const char = text[selectorStart];
                if (char === '}' || char === ';' || char === '\n') {
                    selectorStart++;
                    break;
                }
                selectorStart--;
            }

            // Asegurarse de que no estamos en negativo
            selectorStart = Math.max(0, selectorStart);

            // Extraer el selector
            const selector = text.substring(selectorStart, openBraceIndex).trim();

            // Saltar si el selector está vacío o es un comentario
            if (!selector || selector.startsWith('/*') || selector.startsWith('*')) {
                currentIndex = closeBraceIndex + 1;
                continue;
            }

            // Crear el rango para este bloque
            const range = new vscode.Range(
                positionFromIndex(text, selectorStart),
                positionFromIndex(text, closeBraceIndex + 1)
            );

            // Almacenar el bloque
            if (!blocks.has(selector)) {
                blocks.set(selector, []);
            }
            blocks.get(selector)!.push(range);

            currentIndex = closeBraceIndex + 1;
        }

        // Filtrar solo los selectores duplicados
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

    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {
        // Devolver el contenido del último rango (última versión)
        return editor.document.getText(ranges[ranges.length - 1]);
    }
};