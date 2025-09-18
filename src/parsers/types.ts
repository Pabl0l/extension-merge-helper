import * as vscode from 'vscode';

/**
 * Representa un grupo de bloques de código que se han identificado como duplicados.
 */
export interface DuplicateBlock {
    /** El nombre del bloque duplicado (ej. nombre de función, selector CSS). */
    name: string;
    /** Un array de rangos de VS Code, cada uno correspondiendo a una ocurrencia del bloque duplicado. */
    ranges: vscode.Range[];
    /** El tipo de bloque (ej. 'function', 'class', 'css'). */
    type: string;
    /** El lenguaje de programación del bloque. */
    language: string;
}

/**
 * Define la estructura que debe seguir un parser de lenguaje para ser compatible con la extensión.
 */
export interface LanguageParser {
    /**
     * Busca y devuelve todos los bloques duplicados en un documento de texto.
     * @param text El contenido completo del documento.
     * @param editor El editor de texto activo.
     * @returns Un array de `DuplicateBlock` encontrados.
     */
    findDuplicates: (text: string, editor: vscode.TextEditor) => DuplicateBlock[];

    /**
     * Define la lógica para fusionar un grupo de bloques duplicados.
     * @param editor El editor de texto activo.
     * @param ranges Los rangos de las ocurrencias del bloque duplicado.
     * @returns El string con el contenido del bloque ya fusionado.
     */
    mergeBlocks: (editor: vscode.TextEditor, ranges: vscode.Range[]) => string;
}