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

            if (block.ranges.length <= 1) { continue; }



            try {

                // Ordenar rangos por posición

                const sortedRanges = [...block.ranges].sort((a, b) => a.start.line - b.start.line);

                const firstRange = sortedRanges[0];

                const lastRange = sortedRanges[sortedRanges.length - 1];

                const lastContent = editor.document.getText(lastRange);



                // Primero eliminar todos los rangos excepto el primero (de abajo hacia arriba)

                for (let i = sortedRanges.length - 1; i >= 1; i--) {

                    const range = sortedRanges[i];

                    let rangeToDelete = range;

                    

                    // Expandir rango para incluir líneas vacías si no está cerca del primer rango

                    if (range.start.line > firstRange.end.line + 1) {

                        rangeToDelete = expandRangeToIncludeEmptyLines(editor.document, range);

                    }

                    

                    editBuilder.delete(rangeToDelete);

                }



                // Luego reemplazar el primer rango con el contenido del último

                editBuilder.replace(firstRange, lastContent);



                mergedCount++;

            } catch (error) {

                console.error(`Error fusionando bloque ${block.name}:`, error);

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