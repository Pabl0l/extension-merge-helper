import { javascriptParser } from './javascriptParser';
import { cssParser } from './cssParser';
import { genericParser } from './genericParser';

export function getParserForLanguage(languageId: string) {
    const parsers: any = {
        'javascript': javascriptParser,
        'typescript': javascriptParser,
        'typescriptreact': javascriptParser,
        'javascriptreact': javascriptParser,
        'css': cssParser,
        'scss': cssParser,
        'less': cssParser,
        'html': genericParser,
        'java': genericParser,
        'python': genericParser,
        'php': genericParser,
    };
    return parsers[languageId] || genericParser;
}