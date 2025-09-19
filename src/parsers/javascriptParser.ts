import * as vscode from 'vscode';
import { positionFromIndex, isInsideCommentOrString, findBlockEnd } from '../utils/textUtils';
import { DuplicateBlock, LanguageParser } from './types';

/**
 * Parser to find and merge duplicates in JavaScript and TypeScript code.
 */
export const javascriptParser: LanguageParser = {

    /**
     * Finds duplicate code blocks (functions, classes, etc.) in a text.
     * @param text The full text of the document.
     * @param editor The active text editor.
     * @returns An array of found duplicate blocks.
     */
    findDuplicates: (text: string, editor: vscode.TextEditor): DuplicateBlock[] => {
        const duplicates: DuplicateBlock[] = [];
        const blocks = new Map<string, { ranges: vscode.Range[], contents: string[] }>();

        // Regular expressions to identify declarations of functions, classes, interfaces, etc.
        const namePatterns = [
            // Regular functions: function myFunction() { ... }
            /\b(function)\s+(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g,
            // Arrow functions: const myFunction = () => { ... }
            /\b(const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*\{/g,
            // Functions with assignment: myFunction = function() { ... }
            /\b(\w+)\s*=\s*(?:async\s*)?function\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g,
            // Classes: class MyClass { ... }
            /\b(class)\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g,
            // Interfaces: interface MyInterface { ... }
            /\b(interface)\s+(\w+)\s*\{/g,
            // Enums: enum MyEnum { ... }
            /\b(enum)\s+(\w+)\s*\{/g,
            // Types: type MyType = { ... }
            /\b(type)\s+(\w+)\s*=\s*\{/g,
            // Object literals: const myObject = { ... }
            /\b(const|let|var)\s+(\w+)\s*=\s*\{[^}]*\}/g,
            // Async functions
            /\b(async\s+function\s+\w+\s*\([^)]*\)\s*\{)/g,
            /\b(async\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/g,
            /\b(async\s+\w+\s*\([^)]*\)\s*\{)/g,
            /\b(const|let|var)\s+(\w+)\s*=\s*\{[^}]*\}\s*;?/g
        ];

        const declarations: Array<{ name: string, start: number, end: number }> = [];

        // Iterates over each pattern to find all declarations in the text.
        for (const pattern of namePatterns) {
            let match;
            // Loop to find all matches of a pattern.
            while ((match = pattern.exec(text)) !== null) {
                const matchIndex = match.index;

                // If the match is inside a comment or a string, it is ignored.
                if (isInsideCommentOrString(text, matchIndex)) {continue;}

                let name = '';
                // Extracts the name of the declaration based on the pattern type.
                if (match[1] === 'function' || match[1] === 'class' || 
                    match[1] === 'interface' || match[1] === 'type' || match[1] === 'enum') {
                    name = match[2];
                } else if (match[1] === 'const' || match[1] === 'let' || match[1] === 'var') {
                    name = match[2];
                } else {
                    name = match[1];
                }

                if (name) {
                    // Finds the end of the code block (the closing brace `}`).
                    const blockEnd = findBlockEnd(text, matchIndex);
                    if (blockEnd !== -1) {
                        const blockContent = text.substring(matchIndex, blockEnd);
                        // Ensures that the block is valid (contains '{' and '}').
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

        // Sorts the declarations by their start position to handle overlaps.
        declarations.sort((a, b) => a.start - b.start);

        // Filters overlapping declarations to keep the outermost one.
        const nonOverlappingDeclarations: typeof declarations = [];
        let lastEnd = -1;
        for (const decl of declarations) {
            if (decl.start > lastEnd) {
                nonOverlappingDeclarations.push(decl);
                lastEnd = decl.end;
            }
        }

        // Groups the declarations by name to find duplicates.
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

        // Iterates over the grouped blocks and if a block has more than one occurrence, it is considered a duplicate.
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