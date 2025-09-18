import { javascriptParser } from './javascriptParser';
import { cssParser } from './cssParser';
import { pythonParser } from './pythonParser';
import { genericParser } from './genericParser';

/**
 * Obtiene el parser adecuado para un lenguaje de programación específico.
 * @param languageId El identificador del lenguaje (ej. 'javascript', 'css', 'python').
 * @returns El objeto parser correspondiente al lenguaje. Si no se encuentra un parser específico,
 * devuelve un parser genérico que no realiza ninguna acción.
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
    // Retorna el parser específico para el languageId o el parser genérico si no hay uno específico.
    return parsers[languageId] || genericParser;
}
