import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './types';

export const pythonParser: LanguageParser = {
    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {
        const duplicates: DuplicateBlock[] = [];
        const blocks = new Map<string, vscode.Range[]>();
        const lines = text.split('\n');

        const getIndentation = (line: string): number => {
            return line.match(/^\s*/)?.[0].length || 0;
        };

        const isIgnorableLine = (line: string): boolean => {
            const trimmed = line.trim();
            return trimmed === '' || trimmed.startsWith('#');
        };

        const isDecorator = (line: string): boolean => {
            return line.trim().startsWith('@');
        };

        const getBlockRange = (startLine: number): vscode.Range => {
            const baseIndentation = getIndentation(lines[startLine]);
            let endLine = startLine;

            for (let i = startLine + 1; i < lines.length; i++) {
                const currentLine = lines[i];
                const trimmed = currentLine.trim();
                const currentIndentation = getIndentation(currentLine);

                // Saltar líneas vacías o comentarios dentro del bloque
                if (isIgnorableLine(currentLine)) {
                    endLine = i;
                    continue;
                }

                // Si aparece una línea con menor o igual indentación -> bloque terminó
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

        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            if (processedLines.has(lineNum)) {continue;}

            let line = lines[lineNum];
            let trimmedLine = line.trim();

            if (isIgnorableLine(line)) {continue;}

            // Manejar decoradores -> saltar hasta encontrar def/class
            let decoratorLines: number[] = [];
            while (isDecorator(trimmedLine) && lineNum + 1 < lines.length) {
                decoratorLines.push(lineNum);
                lineNum++;
                line = lines[lineNum];
                trimmedLine = line.trim();
            }

            // Class
            const classMatch = trimmedLine.match(/^class\s+([A-Za-z_]\w*)\s*(?:\([^)]*\))?\s*:/);
            if (classMatch) {
                const className = classMatch[1];
                const range = getBlockRange(lineNum);

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

            // Function (incluye async + multilínea)
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

        // Filtrar duplicados y quitar overlaps
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

    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {
        // Mantener última versión
        return editor.document.getText(ranges[ranges.length - 1]);
    }
};
