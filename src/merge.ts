import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './parsers/types';

export async function mergeDuplicates(
    editor: vscode.TextEditor, 
    duplicates: DuplicateBlock[], 
    parser: LanguageParser
): Promise<{ merged: number }> {
    let mergedCount = 0;

    // Ordenar duplicados por posición (de mayor a menor) para evitar problemas de superposición
    const sortedDuplicates = [...duplicates].sort((a, b) => 
        b.ranges[0].start.line - a.ranges[0].start.line
    );

    await editor.edit(editBuilder => {
        for (const block of sortedDuplicates) {
            if (block.ranges.length <= 1) {continue;}

            try {
                // Verificar que los rangos no se superpongan
                let hasOverlap = false;
                const rangesToCheck = [...block.ranges].sort((a, b) => a.start.line - b.start.line);
                
                for (let i = 0; i < rangesToCheck.length - 1; i++) {
                    if (rangesToCheck[i].end.line >= rangesToCheck[i + 1].start.line) {
                        hasOverlap = true;
                        break;
                    }
                }

                if (hasOverlap) {
                    console.warn(`Skipping overlapping blocks for ${block.name}`);
                    continue;
                }

                // Para JavaScript, eliminar todos menos el último
                // Expandir los rangos para incluir líneas vacías adyacentes
                for (let i = 0; i < block.ranges.length - 1; i++) {
                    const range = block.ranges[i];
                    
                    // Expandir el rango para incluir líneas vacías antes y después
                    const expandedRange = expandRangeToIncludeEmptyLines(editor.document, range);
                    editBuilder.delete(expandedRange);
                }

                mergedCount++;
            } catch (error) {
                console.error(`Error procesando bloque ${block.name}:`, error);
            }
        }
    });

    return { merged: mergedCount };
}

// Función auxiliar para expandir rangos e incluir líneas vacías
function expandRangeToIncludeEmptyLines(document: vscode.TextDocument, range: vscode.Range): vscode.Range {
    let startLine = range.start.line;
    let endLine = range.end.line;
    
    // Buscar líneas vacías antes del bloque
    while (startLine > 0) {
        const lineText = document.lineAt(startLine - 1).text;
        if (lineText.trim() === '') {
            startLine--;
        } else {
            break;
        }
    }
    
    // Buscar líneas vacías después del bloque
    const totalLines = document.lineCount;
    while (endLine < totalLines - 1) {
        const lineText = document.lineAt(endLine + 1).text;
        if (lineText.trim() === '') {
            endLine++;
        } else {
            break;
        }
    }
    
    return new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine + 1, 0)
    );
}