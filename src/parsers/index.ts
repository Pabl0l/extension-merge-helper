import { javascriptParser } from './javascriptParser';
import { cssParser } from './cssParser';
import { pythonParser } from './pythonParser';
import { genericParser } from './genericParser';

/**
 * Gets the appropriate parser for a specific programming language.
 * @param languageId The identifier of the language (e.g., 'javascript', 'css', 'python').
 * @returns The parser object corresponding to the language. If no specific parser is found,
 * it returns a generic parser that performs no action.
 */
export function getParserForLanguage(languageId: string) {
    const parsers: any = {
        'javascript': javascriptParser,
        'typescript': javascriptParser,
        'typescriptreact': javascriptParser,
        'javascriptreact': javascriptParser,
        'css': cssParser,
        'scss': cssParser,
        'less': cssParser,
        'python': pythonParser,
    };
    // Returns the specific parser for the languageId or the generic parser if there is no specific one.
    return parsers[languageId] || genericParser;
}