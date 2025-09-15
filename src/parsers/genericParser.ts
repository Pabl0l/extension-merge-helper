import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './types';

export const genericParser: LanguageParser = {
    findDuplicates: (): DuplicateBlock[] => [],
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {
        return editor.document.getText(ranges[ranges.length - 1]);
    }
};
