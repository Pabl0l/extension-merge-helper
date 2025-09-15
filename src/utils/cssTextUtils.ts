import * as vscode from 'vscode';

export function positionFromIndexCSS(text: string, index: number): vscode.Position {
    if (index < 0 || index > text.length) {
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

export function isInsideCommentOrStringCSS(text: string, index: number): boolean {
    if (index >= text.length) {
        return false;
    }
    
    const precedingText = text.substring(0, index);
    
    // Verificar comentarios de bloque /* */
    const lastBlockCommentStart = precedingText.lastIndexOf('/*');
    const lastBlockCommentEnd = precedingText.lastIndexOf('*/');
    if (lastBlockCommentStart > lastBlockCommentEnd) {
        return true;
    }
    
    return false;
}

export function findMatchingBraceCSS(text: string, startIndex: number, openBrace: string, closeBrace: string): number {
    if (startIndex < 0 || startIndex >= text.length) {
        return -1;
    }
    
    let braceCount = 0;
    let i = startIndex;
    
    // Encontrar la primera llave abierta
    while (i < text.length) {
        if (text[i] === openBrace && !isInsideCommentOrStringCSS(text, i)) {
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
        if (text[i] === openBrace && !isInsideCommentOrStringCSS(text, i)) {
            braceCount++;
        } else if (text[i] === closeBrace && !isInsideCommentOrStringCSS(text, i)) {
            braceCount--;
            if (braceCount === 0) {
                return i;
            }
        }
        i++;
    }
    
    return -1;
}