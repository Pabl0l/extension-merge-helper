import * as vscode from 'vscode';



export function positionFromIndex(text: string, index: number): vscode.Position {

    if (index < 0 || index > text.length) {

        // Si el índice está fuera de rango, devolver posición segura

        console.warn(`Índice fuera de rango: ${index}, text length: ${text.length}`);

        return new vscode.Position(0, 0);

    }

    

    const textBeforeIndex = text.substring(0, index);

    const lines = textBeforeIndex.split('\n');

    

    // Asegurarnos de que tenemos al menos una línea

    if (lines.length === 0) {

        return new vscode.Position(0, 0);

    }

    

    const lineNumber = lines.length - 1;

    const characterPosition = lines[lines.length - 1].length;

    

    // Validar que los valores sean válidos

    if (lineNumber < 0) {

        return new vscode.Position(0, Math.max(0, characterPosition));

    }

    

    return new vscode.Position(lineNumber, characterPosition);

}


export function isInsideCommentOrString(text: string, index: number): boolean {
    if (index >= text.length) {
        return false;
    }
    
    const precedingText = text.substring(0, index);
    
    // Verificar comentarios de línea
    const lineStart = precedingText.lastIndexOf('\n') + 1;
    const lineContent = precedingText.substring(lineStart);
    if (lineContent.includes('//')) {
        return true;
    }
    
    // Verificar comentarios de bloque /* */
    const lastBlockCommentStart = precedingText.lastIndexOf('/*');
    const lastBlockCommentEnd = precedingText.lastIndexOf('*/');
    if (lastBlockCommentStart > lastBlockCommentEnd) {
        return true;
    }
    
    // Para CSS, no necesitamos verificar strings de la misma manera que en JS
    // CSS no tiene strings delimitados por comillas de la misma forma
    return false;
}


export function findMatchingBrace(text: string, startIndex: number, openBrace: string, closeBrace: string): number {
    if (startIndex < 0 || startIndex >= text.length) {
        return -1;
    }
    
    let braceCount = 0;
    let i = startIndex;
    
    // Encontrar la primera llave abierta
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
    
    // Buscar la llave de cierre correspondiente
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



export function findBlockEnd(text: string, startIndex: number): number {
    if (startIndex < 0 || startIndex >= text.length) {
        return -1;
    }
    
    // Buscar la primera llave abierta después del inicio
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



export function getIndentationLevel(line: string): number {

    const match = line.match(/^[\s\t]*/);

    return match ? match[0].length : 0;

}



// Función para verificar si dos rangos se superponen

export function rangesOverlap(range1: vscode.Range, range2: vscode.Range): boolean {

    return range1.intersection(range2) !== undefined;

}