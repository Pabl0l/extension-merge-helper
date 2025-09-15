import * as assert from 'assert';
import { javascriptParser } from '../parsers/javascriptParser';
import * as vscode from 'vscode';

const mockEditor = {
    document: {
        getText: () => ''
    }
} as vscode.TextEditor;

suite('JavaScript Parser Test Suite', () => {
    test('Should not have overlapping ranges', () => {
        const code = `
            class TestClass {
                method1() {
                    console.log('method1');
                }
                
                method2() {
                    console.log('method2');
                }
            }
            
            class TestClass {
                method1() {
                    console.log('different method1');
                }
            }
        `;

        const duplicates = javascriptParser.findDuplicates(code, mockEditor);
        
        // Debería encontrar solo la clase duplicada, no los métodos
        assert.strictEqual(duplicates.length, 1);
        assert.strictEqual(duplicates[0].name, 'TestClass');
        
        // Verificar que los rangos no se superpongan
        const ranges = duplicates[0].ranges;
        for (let i = 0; i < ranges.length - 1; i++) {
            for (let j = i + 1; j < ranges.length; j++) {
                assert.strictEqual(ranges[i].intersection(ranges[j]), undefined, 
                    `Ranges ${i} and ${j} should not overlap`);
            }
        }
    });

    test('Should handle nested functions correctly', () => {
        const code = `
            function outerFunction() {
                function innerFunction() {
                    console.log('inner');
                }
                return innerFunction;
            }
            
            function outerFunction() {
                function innerFunction() {
                    console.log('different inner');
                }
                return innerFunction;
            }
        `;

        const duplicates = javascriptParser.findDuplicates(code, mockEditor);
        
        // Debería encontrar solo la función exterior duplicada
        assert.strictEqual(duplicates.length, 1);
        assert.strictEqual(duplicates[0].name, 'outerFunction');
        
        // Los rangos no deben incluir las funciones internas como duplicados separados
        const ranges = duplicates[0].ranges;
        assert.strictEqual(ranges.length, 2);
    });
});