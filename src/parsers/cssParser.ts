import * as vscode from 'vscode';
import { positionFromIndex, isInsideCommentOrString, findMatchingBrace } from '../utils/textUtils';
import { DuplicateBlock, LanguageParser } from './types';

/**
 * Parser to find and merge duplicates in CSS, SCSS, and Less code.
 */
export const cssParser: LanguageParser = {
    /**
     * Finds duplicate CSS selector blocks in a text.
     * @param text The full text of the document.
     * @param editor The active text editor.
     * @returns An array of found duplicate blocks.
     */
    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {
        const duplicates: DuplicateBlock[] = [];
        const blocks = new Map<string, vscode.Range[]>();

        let currentIndex = 0;
        // Main loop that iterates through the text to find CSS blocks.
        while (currentIndex < text.length) {
            // Finds the next opening brace `{' that indicates the start of a block.
            const openBraceIndex = text.indexOf('{', currentIndex);
            if (openBraceIndex === -1) {break;}

            // Ignores the brace if it is inside a comment or a string.
            if (isInsideCommentOrString(text, openBraceIndex)) {
                currentIndex = openBraceIndex + 1;
                continue;
            }

            // Finds the corresponding closing brace `}`.
            const closeBraceIndex = findMatchingBrace(text, openBraceIndex, '{', '}');
            if (closeBraceIndex === -1) {
                currentIndex = openBraceIndex + 1;
                continue;
            }

            // Moves back from the opening brace to find the start of the selector.
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

            // Extracts the name of the selector.
            const selector = text.substring(selectorStart, openBraceIndex).trim();

            // Ignores empty selectors or those that are part of comments.
            if (!selector || selector.startsWith('/*') || selector.startsWith('*')) {
                currentIndex = closeBraceIndex + 1;
                continue;
            }

            // Creates a range that covers the entire CSS block (selector and body).
            const range = new vscode.Range(
                positionFromIndex(text, selectorStart),
                positionFromIndex(text, closeBraceIndex + 1)
            );

            // Stores the block's range, grouped by selector name.
            if (!blocks.has(selector)) {
                blocks.set(selector, []);
            }
            blocks.get(selector)!.push(range);

            // Advances the search index to the end of the current block.
            currentIndex = closeBraceIndex + 1;
        }

        // Iterates over the grouped blocks to identify those with more than one occurrence.
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
     * Merges a set of duplicate block ranges, keeping the content of the last block.
     * @param editor The active text editor.
     * @param ranges The ranges of the duplicate blocks to merge.
     * @returns The content of the last block, which will be used to replace the others.
     */
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {
        // Returns the content of the last range, which represents the most recent version of the block.
        return editor.document.getText(ranges[ranges.length - 1]);
    }
};