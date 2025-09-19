import * as vscode from 'vscode';

/**
 * Converts a string index to a VS Code `Position` object (line and character).
 * @param text The full text of the document.
 * @param index The character-based index within the text.
 * @returns A `Position` object that corresponds to the index.
 */
export function positionFromIndex(text: string, index: number): vscode.Position {
    if (index < 0 || index > text.length) {
        console.warn(`Index out of range: ${index}, text length: ${text.length}`);
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
 * Checks if a given index in a text is inside a comment (line or block).
 * @param text The full text of the document.
 * @param index The index to check.
 * @returns `true` if the index is inside a comment, `false` otherwise.
 */
export function isInsideCommentOrString(text: string, index: number): boolean {
    if (index >= text.length) {
        return false;
    }
    
    const precedingText = text.substring(0, index);
    
    // Loop to check for line comments (//)
    const lineStart = precedingText.lastIndexOf('\n') + 1;
    const lineContent = precedingText.substring(lineStart);
    if (lineContent.includes('//')) {
        return true;
    }
    
    // Loop to check for block comments (/* */)
    const lastBlockCommentStart = precedingText.lastIndexOf('/*');
    const lastBlockCommentEnd = precedingText.lastIndexOf('*/');
    if (lastBlockCommentStart > lastBlockCommentEnd) {
        return true;
    }
    
    return false;
}

/**
 * Finds the corresponding closing brace for an opening brace in a text.
 * @param text The full text of the document.
 * @param startIndex The index where to start the search.
 * @param openBrace The opening brace character (e.g., '{').
 * @param closeBrace The closing brace character (e.g., '}').
 * @returns The index of the corresponding closing brace, or -1 if not found.
 */
export function findMatchingBrace(text: string, startIndex: number, openBrace: string, closeBrace: string): number {
    if (startIndex < 0 || startIndex >= text.length) {
        return -1;
    }
    
    let braceCount = 0;
    let i = startIndex;
    
    // Loop to find the first opening brace.
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
    
    // Loop to search for the corresponding closing brace, keeping a counter of nested braces.
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
 * Finds the end of a code block (delimited by braces) from a start index.
 * @param text The full text of the document.
 * @param startIndex The index where to start searching for the first opening brace.
 * @returns The index of the end of the block, or -1 if not found.
 */
export function findBlockEnd(text: string, startIndex: number): number {
    if (startIndex < 0 || startIndex >= text.length) {
        return -1;
    }
    
    // Loop to search for the first opening brace after the start index.
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