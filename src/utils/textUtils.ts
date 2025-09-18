import * as vscode from 'vscode';

/**
 * Convierte un índice de un string en un objeto `Position` de VS Code (línea y carácter).
 * @param text El texto completo del documento.
 * @param index El índice basado en caracteres dentro del texto.
 * @returns Un objeto `Position` que corresponde al índice.
 */
export function positionFromIndex(text: string, index: number): vscode.Position {
    if (index < 0 || index > text.length) {
        console.warn(`Índice fuera de rango: ${index}, text length: ${text.length}`);
        return new vscode.Position(0, 0);
    }
    
    const textBeforeIndex = text.substring(0, index);
    const lines = textBeforeIndex.split('\n');
    
    if (lines.length === 0) {
        return new vscode.Position(0, 0);
    }
    
    const lineNumber = lines.length - 1;
    const characterPosition = lines[lines.length - 1].length;
    
    if (lineNumber < 0) {
        return new vscode.Position(0, Math.max(0, characterPosition));
    }
    
    return new vscode.Position(lineNumber, characterPosition);
}

/**
 * Verifica si un índice dado en un texto se encuentra dentro de un comentario (de línea o de bloque).
 * @param text El texto completo del documento.
 * @param index El índice a verificar.
 * @returns `true` si el índice está dentro de un comentario, `false` en caso contrario.
 */
export function isInsideCommentOrString(text: string, index: number): boolean {
    if (index >= text.length) {
        return false;
    }
    
    const precedingText = text.substring(0, index);
    
    // Bucle para verificar comentarios de línea (//)
    const lineStart = precedingText.lastIndexOf('\n') + 1;
    const lineContent = precedingText.substring(lineStart);
    if (lineContent.includes('//')) {
        return true;
    }
    
    // Bucle para verificar comentarios de bloque (/* */)
    const lastBlockCommentStart = precedingText.lastIndexOf('/*');
    const lastBlockCommentEnd = precedingText.lastIndexOf('*/');
    if (lastBlockCommentStart > lastBlockCommentEnd) {
        return true;
    }
    
    return false;
}

/**
 * Encuentra la llave de cierre correspondiente a una de apertura en un texto.
 * @param text El texto completo del documento.
 * @param startIndex El índice donde empezar la búsqueda.
 * @param openBrace El carácter de la llave de apertura (ej. '{').
 * @param closeBrace El carácter de la llave de cierre (ej. '}').
 * @returns El índice de la llave de cierre correspondiente, o -1 si no se encuentra.
 */
export function findMatchingBrace(text: string, startIndex: number, openBrace: string, closeBrace: string): number {
    if (startIndex < 0 || startIndex >= text.length) {
        return -1;
    }
    
    let braceCount = 0;
    let i = startIndex;
    
    // Bucle para encontrar la primera llave de apertura.
    while (i < text.length) {
        if (text[i] === openBrace && !isInsideCommentOrString(text, i)) {
            braceCount = 1;
            i++;
            break;
        }
        i++;
    }
    
    if (braceCount === 0) {
        return -1;
    }
    
    // Bucle para buscar la llave de cierre correspondiente, manteniendo un contador de llaves anidadas.
    while (i < text.length) {
        if (text[i] === openBrace && !isInsideCommentOrString(text, i)) {
            braceCount++;
        } else if (text[i] === closeBrace && !isInsideCommentOrString(text, i)) {
            braceCount--;
            if (braceCount === 0) {
                return i;
            }
        }
        i++;
    }
    
    return -1;
}

/**
 * Encuentra el final de un bloque de código (delimitado por llaves) a partir de un índice de inicio.
 * @param text El texto completo del documento.
 * @param startIndex El índice donde empezar a buscar la primera llave de apertura.
 * @returns El índice del final del bloque, o -1 si no se encuentra.
 */
export function findBlockEnd(text: string, startIndex: number): number {
    if (startIndex < 0 || startIndex >= text.length) {
        return -1;
    }
    
    // Bucle para buscar la primera llave de apertura después del índice de inicio.
    let braceIndex = startIndex;
    while (braceIndex < text.length) {
        if (text[braceIndex] === '{' && !isInsideCommentOrString(text, braceIndex)) {
            const endIndex = findMatchingBrace(text, braceIndex, '{', '}');
            return endIndex !== -1 ? endIndex + 1 : -1;
        }
        braceIndex++;
    }
    
    return -1;
}
