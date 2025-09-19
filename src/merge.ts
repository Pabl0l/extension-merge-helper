import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './parsers/types';

/**
 * Performs the merge of duplicate code blocks in the editor.
 * @param editor The active VS Code text editor.
 * @param duplicates An array of duplicate blocks found by the parser.
 * @param parser The language parser used to find the duplicates.
 * @returns A promise that resolves with the number of merged blocks.
 */
export async function mergeDuplicates(
    editor: vscode.TextEditor, 
    duplicates: DuplicateBlock[], 
    parser: LanguageParser
): Promise<{ merged: number }> {
    let mergedCount = 0;

    // Sorts the duplicates by their position in the document from highest to lowest.
    // This is crucial to prevent edits from affecting the positions of the remaining blocks.
    const sortedDuplicates = [...duplicates].sort((a, b) => 
        b.ranges[0].start.line - a.ranges[0].start.line
    );

    await editor.edit(editBuilder => {
        // Iterates over each group of duplicate blocks.
        for (const block of sortedDuplicates) {
            if (block.ranges.length <= 1) { continue; }

            try {
                // Sorts the ranges of a duplicate block by their start line.
                const sortedRanges = [...block.ranges].sort((a, b) => a.start.line - b.start.line);
                const firstRange = sortedRanges[0];
                const lastRange = sortedRanges[sortedRanges.length - 1];
                const lastContent = editor.document.getText(lastRange);

                // Deletes all duplicate blocks except the first one, starting from the last one.
                // This ensures that the range positions are not invalidated during deletion.
                for (let i = sortedRanges.length - 1; i >= 1; i--) {
                    const range = sortedRanges[i];
                    let rangeToDelete = range;

                    // If the block is not immediately after the previous one, expand the range
                    // to include empty lines and maintain the code formatting.
                    if (range.start.line > firstRange.end.line + 1) {
                        rangeToDelete = expandRangeToIncludeEmptyLines(editor.document, range);
                    }
                    
                    editBuilder.delete(rangeToDelete);
                }

                // Replaces the first block with the content of the last one, which is the most recent version.
                editBuilder.replace(firstRange, lastContent);

                mergedCount++;
            } catch (error) {
                console.error(`Error merging block ${block.name}:`, error);
            }
        }
    });

    return { merged: mergedCount };
}

/**
 * Expands a range to include adjacent empty lines before and after.
 * @param document The active text document.
 * @param range The range to expand.
 * @returns A new range that includes the surrounding empty lines.
 */
function expandRangeToIncludeEmptyLines(document: vscode.TextDocument, range: vscode.Range): vscode.Range {
    let startLine = range.start.line;
    let endLine = range.end.line;

    // Loop to search for empty lines before the block and expand the range upwards.
    while (startLine > 0) {
        const lineText = document.lineAt(startLine - 1).text;
        if (lineText.trim() === '') {
            startLine--;
        } else {
            break;
        }
    }

    // Loop to search for empty lines after the block and expand the range downwards.
    while (endLine < document.lineCount - 1) {
        const lineText = document.lineAt(endLine + 1).text;
        if (lineText.trim() === '') {
            endLine++;
        } else {
            break;
        }
    }

    return new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
    );
}