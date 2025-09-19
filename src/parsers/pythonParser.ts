import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './types';

/**
 * Parser to find and merge duplicates in Python code.
 */
export const pythonParser: LanguageParser = {
    /**
     * Finds duplicate code blocks (functions and classes) in a Python text.
     * @param text The full text of the document.
     * @param editor The active text editor.
     * @returns An array of found duplicate blocks.
     */
    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {
        const duplicates: DuplicateBlock[] = [];
        const blocks = new Map<string, vscode.Range[]>();
        const lines = text.split('\n');

        /**
         * Calculates the indentation of a line.
         * @param line The text line.
         * @returns The number of indentation spaces.
         */
        const getIndentation = (line: string): number => {
            return line.match(/^\s*/)?.[0].length || 0;
        };

        /**
         * Checks if a line is a comment or an empty string.
         * @param line The text line.
         * @returns `true` if the line is ignorable.
         */
        const isIgnorableLine = (line: string): boolean => {
            const trimmed = line.trim();
            return trimmed === '' || trimmed.startsWith('#');
        };

        /**
         * Checks if a line is a decorator.
         * @param line The text line.
         * @returns `true` if the line is a decorator.
         */
        const isDecorator = (line: string): boolean => {
            return line.trim().startsWith('@');
        };

        /**
         * Gets the full range of a code block (function or class) from its start line.
         * @param startLine The line number where the block begins.
         * @returns The VS Code range that covers the entire block.
         */
        const getBlockRange = (startLine: number): vscode.Range => {
            const baseIndentation = getIndentation(lines[startLine]);
            let endLine = startLine;

            // Iterates over the following lines to find the end of the block based on indentation.
            for (let i = startLine + 1; i < lines.length; i++) {
                const currentLine = lines[i];
                const currentIndentation = getIndentation(currentLine);

                if (isIgnorableLine(currentLine)) {
                    endLine = i;
                    continue;
                }

                // A block ends when a line has an indentation less than or equal to the base.
                if (currentIndentation <= baseIndentation && !isDecorator(currentLine)) {
                    break;
                }

                endLine = i;
            }

            const startPos = new vscode.Position(startLine, 0);
            const endPos = new vscode.Position(endLine, lines[endLine].length);
            return new vscode.Range(startPos, endPos);
        };

        const processedLines = new Set<number>();

        // Iterates over each line of the document to find the beginnings of blocks.
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            if (processedLines.has(lineNum)) {continue;}

            let line = lines[lineNum];
            let trimmedLine = line.trim();

            if (isIgnorableLine(line)) {continue;}

            // Skips decorator lines to find the function or class definition.
            let decoratorLines: number[] = [];
            while (isDecorator(trimmedLine) && lineNum + 1 < lines.length) {
                decoratorLines.push(lineNum);
                lineNum++;
                line = lines[lineNum];
                trimmedLine = line.trim();
            }

            // Searches for class definitions.
            const classMatch = trimmedLine.match(/^class\s+([A-Za-z_]\w*)\s*(?:[^)]*)?\s*:/);
            if (classMatch) {
                const className = classMatch[1];
                const range = getBlockRange(lineNum);

                // Marks the block lines as processed to avoid analyzing them again.
                for (let i = range.start.line; i <= range.end.line; i++) {
                    processedLines.add(i);
                }
                for (const d of decoratorLines) {processedLines.add(d);}

                if (!blocks.has(className)) {
                    blocks.set(className, []);
                }
                blocks.get(className)!.push(range);
                continue;
            }

            // Searches for function definitions (including async).
            const functionMatch = trimmedLine.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(.*\)\s*:/);
            if (functionMatch) {
                const functionName = functionMatch[1];
                const range = getBlockRange(lineNum);

                for (let i = range.start.line; i <= range.end.line; i++) {
                    processedLines.add(i);
                }
                for (const d of decoratorLines) {processedLines.add(d);}

                if (!blocks.has(functionName)) {
                    blocks.set(functionName, []);
                }
                blocks.get(functionName)!.push(range);
                continue;
            }
        }

        // Filters the blocks to find duplicates and removes overlapping ranges.
        for (const [name, ranges] of blocks.entries()) {
            if (ranges.length > 1) {
                const sorted = ranges.sort((a, b) => a.start.line - b.start.line);
                const nonOverlapping: vscode.Range[] = [];
                let lastEnd = -1;

                for (const r of sorted) {
                    if (r.start.line > lastEnd) {
                        nonOverlapping.push(r);
                        lastEnd = r.end.line;
                    }
                }

                if (nonOverlapping.length > 1) {
                    duplicates.push({
                        name,
                        ranges: nonOverlapping,
                        type: 'block',
                        language: 'python'
                    });
                }
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
