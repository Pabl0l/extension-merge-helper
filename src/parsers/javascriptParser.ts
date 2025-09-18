import * as vscode from 'vscode';
import { positionFromIndex, isInsideCommentOrString, findBlockEnd } from '../utils/textUtils';
import { DuplicateBlock, LanguageParser } from './types';

/**
 * Parser para encontrar y fusionar duplicados en código JavaScript y TypeScript.
 */
export const javascriptParser: LanguageParser = {

    /**
     * Encuentra bloques de código duplicados (funciones, clases, etc.) en un texto.
     * @param text El texto completo del documento.
     * @param editor El editor de texto activo.
     * @returns Un array de bloques duplicados encontrados.
     */
    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {
        const duplicates: DuplicateBlock[] = [];
        const blocks = new Map<string, { ranges: vscode.Range[], contents: string[] }>();

        // Expresiones regulares para identificar declaraciones de funciones, clases, interfaces, etc.
        const namePatterns = [
            // Funciones regulares: function miFuncion() { ... }
            /\b(function)\s+(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g,
            // Funciones flecha: const miFuncion = () => { ... }
            /\b(const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{/g,
            // Funciones con asignación: miFuncion = function() { ... }
            /\b(\w+)\s*=\s*(?:async\s*)?function\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g,
            // Clases: class MiClase { ... }
            /\b(class)\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g,
            // Interfaces: interface MiInterfaz { ... }
            /\b(interface)\s+(\w+)\s*\{/g,
            // Enums: enum MiEnum { ... }
            /\b(enum)\s+(\w+)\s*\{/g,
            // Types: type MiType = { ... }
            /\b(type)\s+(\w+)\s*=\s*\{/g,
            // Literales de objeto: const miObjeto = { ... }
            /\b(const|let|var)\s+(\w+)\s*=\s*\{[^}]*\}/g,
            // Funciones asíncronas
            /\b(async\s+function\s+\w+\s*\([^)]*\)\s*\{)/g,
            /\b(async\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/g,
            /\b(async\s+\w+\s*\([^)]*\)\s*\{)/g,
            /\b(const|let|var)\s+(\w+)\s*=\s*\{[^}]*\}\s*;?/g
        ];

        const declarations: Array<{ name: string, start: number, end: number }> = [];

        // Itera sobre cada patrón para encontrar todas las declaraciones en el texto.
        for (const pattern of namePatterns) {
            let match;
            // Bucle para encontrar todas las coincidencias de un patrón.
            while ((match = pattern.exec(text)) !== null) {
                const matchIndex = match.index;

                // Si la coincidencia está dentro de un comentario o una cadena, se ignora.
                if (isInsideCommentOrString(text, matchIndex)) {continue;}

                let name = '';
                // Extrae el nombre de la declaración basado en el tipo de patrón.
                if (match[1] === 'function' || match[1] === 'class' || 
                    match[1] === 'interface' || match[1] === 'type' || match[1] === 'enum') {
                    name = match[2];
                } else if (match[1] === 'const' || match[1] === 'let' || match[1] === 'var') {
                    name = match[2];
                } else {
                    name = match[1];
                }

                if (name) {
                    // Encuentra el final del bloque de código (la llave de cierre `}`).
                    const blockEnd = findBlockEnd(text, matchIndex);
                    if (blockEnd !== -1) {
                        const blockContent = text.substring(matchIndex, blockEnd);
                        // Asegura que el bloque sea válido (contiene `{` y `}`).
                        if (blockContent.includes('{') && blockContent.includes('}')) {
                            declarations.push({
                                name,
                                start: matchIndex,
                                end: blockEnd
                            });
                        }
                    }
                }
            }
        }

        // Ordena las declaraciones por su posición de inicio para manejar superposiciones.
        declarations.sort((a, b) => a.start - b.start);

        // Filtra las declaraciones superpuestas para quedarse con la más externa.
        const nonOverlappingDeclarations: typeof declarations = [];
        let lastEnd = -1;
        for (const decl of declarations) {
            if (decl.start > lastEnd) {
                nonOverlappingDeclarations.push(decl);
                lastEnd = decl.end;
            }
        }

        // Agrupa las declaraciones por nombre para encontrar duplicados.
        for (const decl of nonOverlappingDeclarations) {
            const blockContent = text.substring(decl.start, decl.end).trim();
            const range = new vscode.Range(
                positionFromIndex(text, decl.start),
                positionFromIndex(text, decl.end)
            );

            if (!blocks.has(decl.name)) {
                blocks.set(decl.name, { ranges: [], contents: [] });
            }

            const blockInfo = blocks.get(decl.name)!;
            blockInfo.ranges.push(range);
            blockInfo.contents.push(blockContent);
        }

        // Itera sobre los bloques agrupados y si un bloque tiene más de una ocurrencia, se considera un duplicado.
        for (const [name, blockInfo] of blocks.entries()) {
            if (blockInfo.ranges.length > 1) {
                duplicates.push({
                    name,
                    ranges: blockInfo.ranges,
                    type: 'block',
                    language: 'javascript'
                });
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