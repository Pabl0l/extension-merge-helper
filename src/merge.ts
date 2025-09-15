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
                const mergedContent = parser.mergeBlocks(editor, block.ranges);

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

                // Para CSS, eliminar todos los bloques y agregar el fusionado al final
                for (const range of block.ranges) {
                    editBuilder.delete(range);
                }
                
                // Insertar el contenido fusionado después del último bloque
                const lastRange = block.ranges[block.ranges.length - 1];
                editBuilder.insert(lastRange.end, '\n' + mergedContent);

                mergedCount++;
            } catch (error) {
                console.error(`Error fusionando bloque ${block.name}:`, error);
            }
        }
    });

    return { merged: mergedCount };
}