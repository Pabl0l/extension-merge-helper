import * as vscode from 'vscode';

export interface DuplicateBlock {
    name: string;
    ranges: vscode.Range[];
    type: string;
    language: string;
}

export interface LanguageParser {
    findDuplicates: (text: string, editor: vscode.TextEditor) => DuplicateBlock[];
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]) => string;
}
