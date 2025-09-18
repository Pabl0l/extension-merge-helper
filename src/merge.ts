import * as vscode from 'vscode';
import { DuplicateBlock, LanguageParser } from './parsers/types';

/**
 * Realiza la fusión de bloques de código duplicados en el editor.
 * @param editor El editor de texto activo de VS Code.
 * @param duplicates Un array de bloques duplicados encontrados por el parser.
 * @param parser El parser del lenguaje utilizado para encontrar los duplicados.
 * @returns Una promesa que se resuelve con el número de bloques fusionados.
 */
export async function mergeDuplicates(
    editor: vscode.TextEditor, 
    duplicates: DuplicateBlock[], 
    parser: LanguageParser
): Promise<{ merged: number }> {
    let mergedCount = 0;

    // Ordena los duplicados por su posición en el documento de mayor a menor.
    // Esto es crucial para evitar que las ediciones afecten las posiciones de los bloques restantes.
    const sortedDuplicates = [...duplicates].sort((a, b) => 
        b.ranges[0].start.line - a.ranges[0].start.line
    );

    await editor.edit(editBuilder => {
        // Itera sobre cada grupo de bloques duplicados.
        for (const block of sortedDuplicates) {
            if (block.ranges.length <= 1) { continue; }

            try {
                // Ordena los rangos de un bloque duplicado por su línea de inicio.
                const sortedRanges = [...block.ranges].sort((a, b) => a.start.line - b.start.line);
                const firstRange = sortedRanges[0];
                const lastRange = sortedRanges[sortedRanges.length - 1];
                const lastContent = editor.document.getText(lastRange);

                // Elimina todos los bloques duplicados excepto el primero, empezando desde el último.
                // Esto asegura que las posiciones de los rangos no se invaliden durante la eliminación.
                for (let i = sortedRanges.length - 1; i >= 1; i--) {
                    const range = sortedRanges[i];
                    let rangeToDelete = range;

                    // Si el bloque no está inmediatamente después del anterior, expande el rango
                    // para incluir líneas vacías y mantener el formato del código.
                    if (range.start.line > firstRange.end.line + 1) {
                        rangeToDelete = expandRangeToIncludeEmptyLines(editor.document, range);
                    }
                    
                    editBuilder.delete(rangeToDelete);
                }

                // Reemplaza el primer bloque con el contenido del último, que es la versión más reciente.
                editBuilder.replace(firstRange, lastContent);

                mergedCount++;
            } catch (error) {
                console.error(`Error fusionando bloque ${block.name}:`, error);
            }
        }
    });

    return { merged: mergedCount };
}

/**
 * Expande un rango para incluir las líneas vacías adyacentes antes y después.
 * @param document El documento de texto activo.
 * @param range El rango a expandir.
 * @returns Un nuevo rango que incluye las líneas vacías circundantes.
 */
function expandRangeToIncludeEmptyLines(document: vscode.TextDocument, range: vscode.Range): vscode.Range {
    let startLine = range.start.line;
    let endLine = range.end.line;

    // Bucle para buscar líneas vacías antes del bloque y expandir el rango hacia arriba.
    while (startLine > 0) {
        const lineText = document.lineAt(startLine - 1).text;
        if (lineText.trim() === '') {
            startLine--;
        } else {
            break;
        }
    }

    // Bucle para buscar líneas vacías después del bloque y expandir el rango hacia abajo.
    while (endLine < document.lineCount - 1) {
        const lineText = document.lineAt(endLine + 1).text;
        if (lineText.trim() === '') {
            endLine++;
        } else {
            break;
        }
    }

    return new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
    );
}
