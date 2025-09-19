import * as vscode from 'vscode';

/**
 * Represents a group of code blocks that have been identified as duplicates.
 */
export interface DuplicateBlock {
    /** The name of the duplicate block (e.g., function name, CSS selector). */
    name: string;
    /** An array of VS Code ranges, each corresponding to an occurrence of the duplicate block. */
    ranges: vscode.Range[];
    /** The type of block (e.g., 'function', 'class', 'css'). */
    type: string;
    /** The programming language of the block. */
    language: string;
}

/**
 * Defines the structure that a language parser must follow to be compatible with the extension.
 */
export interface LanguageParser {
    /**
     * Finds and returns all duplicate blocks in a text document.
     * @param text The full content of the document.
     * @param editor The active text editor.
     * @returns An array of `DuplicateBlock` found.
     */
    findDuplicates: (text: string, editor: vscode.TextEditor) => DuplicateBlock[];

    /**
     * Defines the logic for merging a group of duplicate blocks.
     * @param editor The active text editor.
     * @param ranges The ranges of the occurrences of the duplicate block.
     * @returns The string with the content of the already merged block.
     */
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]) => string;
}
