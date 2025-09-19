import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './types';

/**
 * A generic parser that is used when there is no specific parser for the current language.
 * It does not perform any duplicate search action.
 */
export const genericParser: LanguageParser = {
    /**
     * Returns an empty array, as this parser does not detect duplicates.
     * @returns An empty array.
     */
    findDuplicates: (): DuplicateBlock[] => [],

    /**
     * Returns the content of the last provided range. Although not actively used
     * with an empty `findDuplicates`, it implements the required interface.
     * @param editor The active text editor.
     * @param ranges An array of ranges.
     * @returns The text of the last range.
     */
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {
        return editor.document.getText(ranges[ranges.length - 1]);
    }
};