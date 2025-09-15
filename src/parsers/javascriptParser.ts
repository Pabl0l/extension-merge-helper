import * as vscode from 'vscode';

import { positionFromIndex, isInsideCommentOrString, findBlockEnd } from '../utils/textUtils';

import { DuplicateBlock, LanguageParser } from './types';



// ================== MERGE HELPERS ==================



// Merge de funciones: une líneas únicas dentro del cuerpo

function mergeFunctions(editor: vscode.TextEditor, ranges: vscode.Range[]): string {

    const seen = new Set<string>();

    const mergedLines: string[] = [];

    let header = "";



    for (const range of ranges) {

        const blockText = editor.document.getText(range).trim();

        console.log(`Procesando función: ${blockText}`);

        

        // Extraer el header (todo antes de la primera llave)

        const headerMatch = blockText.match(/^[^{]+\{/);

        if (headerMatch) {

            header = headerMatch[0];

        }



        // Extraer el cuerpo (contenido entre llaves)

        const bodyMatch = blockText.match(/\{([\s\S]*)\}$/);

        if (bodyMatch) {

            const bodyContent = bodyMatch[1].trim();

            console.log(`Cuerpo de la función: ${bodyContent}`);

            

            // Dividir en líneas y procesar

            const lines = bodyContent.split('\n');

            for (const line of lines) {

                const normalized = line.trim();

                if (normalized && !seen.has(normalized) && !normalized.includes('}')) {

                    seen.add(normalized);

                    mergedLines.push("    " + normalized);

                }

            }

        }

    }



    // Construir la función merged

    const mergedBody = mergedLines.join("\n");

    return `${header}\n${mergedBody}\n}`;

}



// Merge de clases: une métodos únicos dentro de la clase

function mergeClasses(editor: vscode.TextEditor, ranges: vscode.Range[]): string {

    const methods = new Map<string, string>();

    let header = "";



    for (const range of ranges) {

        const blockText = editor.document.getText(range).trim();

        console.log(`Procesando clase: ${blockText}`);

        

        const headerMatch = blockText.match(/^[^{]+\{/);

        if (headerMatch) {

            header = headerMatch[0];

        }



        const bodyMatch = blockText.match(/\{([\s\S]*)\}$/);

        if (bodyMatch) {

            const bodyContent = bodyMatch[1].trim();

            

            // Detectar métodos de forma más robusta

            const methodRegex = /(\w+)\s*\([^)]*\)\s*\{([^{}]*)\}/g;

            let match;

            

            while ((match = methodRegex.exec(bodyContent)) !== null) {

                const methodName = match[1];

                const methodBody = match[2].trim();

                

                if (!methods.has(methodName)) {

                    methods.set(methodName, `    ${methodName}() {\n        ${methodBody}\n    }`);

                }

            }

        }

    }



    const mergedMethods = [...methods.values()].join("\n\n");

    return `${header}\n${mergedMethods}\n}`;

}



// Merge de objetos: une propiedades únicas dentro del objeto literal

function mergeObjects(editor: vscode.TextEditor, ranges: vscode.Range[]): string {

    const props = new Map<string, string>();

    let header = "";



    for (const range of ranges) {

        const blockText = editor.document.getText(range).trim();

        console.log(`Procesando objeto: ${blockText}`);

        

        const headerMatch = blockText.match(/^[^{]+\{/);

        if (headerMatch) {

            header = headerMatch[0];

        }



        const bodyMatch = blockText.match(/\{([\s\S]*)\}$/);

        if (bodyMatch) {

            const bodyContent = bodyMatch[1].trim();

            const lines = bodyContent.split('\n');

            

            for (const line of lines) {

                const trimmed = line.trim().replace(/,$/, "").replace(/;$/, "");

                if (trimmed && !trimmed.includes('}')) {

                    const colonIndex = trimmed.indexOf(':');

                    if (colonIndex > -1) {

                        const key = trimmed.substring(0, colonIndex).trim();

                        const value = trimmed.substring(colonIndex + 1).trim();

                        if (key && value && !props.has(key)) {

                            props.set(key, `    ${key}: ${value},`);

                        }

                    }

                }

            }

        }

    }



    const mergedProps = [...props.values()].join("\n");

    return `${header}\n${mergedProps}\n};`;

}



// ================== PARSER ==================

// ================== PARSER SIMPLIFICADO ==================

export const javascriptParser: LanguageParser = {

    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {

        const duplicates: DuplicateBlock[] = [];

        const blocks = new Map<string, { ranges: vscode.Range[], contents: string[] }>();



        // Patrones mejorados para capturar declaraciones completas

        // Patrones mejorados para capturar declaraciones completas

        const namePatterns = [

            // Funciones regulares

            /\b(function)\s+(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g,

            // Funciones flecha

            /\b(const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{/g,

            // Funciones con asignación

            /\b(\w+)\s*=\s*(?:async\s*)?function\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g,

            // Clases

            /\b(class)\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g,

            // Interfaces

            /\b(interface)\s+(\w+)\s*\{/g,

            // Enums

            /\b(enum)\s+(\w+)\s*\{/g,

            // Types

            /\b(type)\s+(\w+)\s*=\s*\{/g,

            // Object literals (mejorado)

            /\b(const|let|var)\s+(\w+)\s*=\s*\{[^}]*\}/g

        ];



        const declarations: Array<{ name: string, start: number, end: number }> = [];



        for (const pattern of namePatterns) {

            let match;

            while ((match = pattern.exec(text)) !== null) {

                const matchIndex = match.index;

                if (isInsideCommentOrString(text, matchIndex)) {continue;}



                let name = '';

                if (match[1] === 'function' || match[1] === 'class' || 

                    match[1] === 'interface' || match[1] === 'type' || match[1] === 'enum') {

                    name = match[2];

                } else if (match[1] === 'const' || match[1] === 'let' || match[1] === 'var') {

                    name = match[2];

                } else {

                    name = match[1];

                }





                if (name) {

                    const blockEnd = findBlockEnd(text, matchIndex);

                    if (blockEnd !== -1) {

                        // Verificar que el bloque contenga tanto la declaración como el cuerpo

                        const blockContent = text.substring(matchIndex, blockEnd);

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



        // Ordenar declaraciones por posición de inicio

        declarations.sort((a, b) => a.start - b.start);



        // Filtrar declaraciones que se overlapean

        const nonOverlappingDeclarations: typeof declarations = [];

        let lastEnd = -1;



        for (const decl of declarations) {

            if (decl.start > lastEnd) {

                nonOverlappingDeclarations.push(decl);

                lastEnd = decl.end;

            }

        }



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



        // Solo considerar duplicados si hay múltiples versiones

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



    // Función mergeBlocks simplificada - ya no necesitamos lógica compleja

    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]): string => {

        // Simplemente devolver el contenido del último rango (versión más reciente)

        return editor.document.getText(ranges[ranges.length - 1]);

    }

};
