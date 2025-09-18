import { javascriptParser } from './javascriptParser';
import { cssParser } from './cssParser';
import { pythonParser } from './pythonParser';
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
        'python': pythonParser,
    };
    return parsers[languageId] || genericParser;
}