import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './types';

/**
 * Parser para encontrar y fusionar duplicados en código Python.
 */
export const pythonParser: LanguageParser = {
    /**
     * Encuentra bloques de código duplicados (funciones y clases) en un texto de Python.
     * @param text El texto completo del documento.
     * @param editor El editor de texto activo.
     * @returns Un array de bloques duplicados encontrados.
     */
    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {
        const duplicates: DuplicateBlock[] = [];
        const blocks = new Map<string, vscode.Range[]>();
        const lines = text.split('\n');

        /**
         * Calcula la indentación de una línea.
         * @param line La línea de texto.
         * @returns El número de espacios de indentación.
         */
        const getIndentation = (line: string): number => {
            return line.match(/^\s*/)?.[0].length || 0;
        };

        /**
         * Comprueba si una línea es un comentario o una cadena vacía.
         * @param line La línea de texto.
         * @returns `true` si la línea es ignorable.
         */
        const isIgnorableLine = (line: string): boolean => {
            const trimmed = line.trim();
            return trimmed === '' || trimmed.startsWith('#');
        };

        /**
         * Comprueba si una línea es un decorador.
         * @param line La línea de texto.
         * @returns `true` si la línea es un decorador.
         */
        const isDecorator = (line: string): boolean => {
            return line.trim().startsWith('@');
        };

        /**
         * Obtiene el rango completo de un bloque de código (función o clase) a partir de su línea de inicio.
         * @param startLine El número de la línea donde comienza el bloque.
         * @returns El rango de VS Code que abarca todo el bloque.
         */
        const getBlockRange = (startLine: number): vscode.Range => {
            const baseIndentation = getIndentation(lines[startLine]);
            let endLine = startLine;

            // Itera sobre las líneas siguientes para encontrar el final del bloque basándose en la indentación.
            for (let i = startLine + 1; i < lines.length; i++) {
                const currentLine = lines[i];
                const currentIndentation = getIndentation(currentLine);

                if (isIgnorableLine(currentLine)) {
                    endLine = i;
                    continue;
                }

                // Un bloque termina cuando una línea tiene una indentación menor o igual a la base.
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

        // Itera sobre cada línea del documento para encontrar inicios de bloques.
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            if (processedLines.has(lineNum)) {continue;}

            let line = lines[lineNum];
            let trimmedLine = line.trim();

            if (isIgnorableLine(line)) {continue;}

            // Salta las líneas de decoradores para encontrar la definición de la función o clase.
            let decoratorLines: number[] = [];
            while (isDecorator(trimmedLine) && lineNum + 1 < lines.length) {
                decoratorLines.push(lineNum);
                lineNum++;
                line = lines[lineNum];
                trimmedLine = line.trim();
            }

            // Busca definiciones de clases.
            const classMatch = trimmedLine.match(/^class\s+([A-Za-z_]\w*)\s*(?:[^)]*)?\s*:/);
            if (classMatch) {
                const className = classMatch[1];
                const range = getBlockRange(lineNum);

                // Marca las líneas del bloque como procesadas para evitar analizarlas de nuevo.
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

            // Busca definiciones de funciones (incluyendo asíncronas).
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

        // Filtra los bloques para encontrar duplicados y elimina los rangos superpuestos.
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
     * Fusiona un conjunto de rangos de bloques duplicados, conservando el contenido del último bloque.
     * @param editor El editor de texto activo.
     * @param ranges Los rangos de los bloques duplicados a fusionar.
     * @returns El contenido del último bloque, que se usará para reemplazar a los demás.
     */
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {
        // Devuelve el contenido del último rango, que representa la versión más reciente del bloque.
        return editor.document.getText(ranges[ranges.length - 1]);
    }
};