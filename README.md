# Merge Helper

Merge Helper is a Visual Studio Code extension designed to refactor your code by eliminating duplicate blocks and keeping the most recent version.

## How it works

This extension analyzes the active file for duplicate code blocks (such as functions, classes, or CSS selectors with the same name). When it finds duplicates, it removes all previous occurrences and keeps only the latest version of the block in the position of the first occurrence.

This is especially useful in code merge scenarios, where it is common to have conflicts or duplicates of functions that have been modified in different branches.

## Features

- **Smart merging:** Keeps the latest version of a code block and removes the others.
- **Multi-language support:** Works with:
  - JavaScript
  - TypeScript
  - CSS
  - Python
- **Easy to use:** Activated with a single click from the editor's context menu.

## Usage

1.  Open a file of one of the supported languages (`.js`, `.ts`, `.css`, `.py`).
2.  Right-click anywhere in the editor to open the context menu.
3.  Select the "Merge" option corresponding to the language of your file:
    - `Merge JavaScript`
    - `Merge CSS`
    - `Merge Python`

The extension will analyze the file, perform the merge, and notify you of the result.

## Commands

| Command                 | Title           | Description                               |
| ----------------------- | ---------------- | ----------------------------------------- |
| `merge-helper.merge-javascript` | Merge JavaScript | Merges duplicate blocks in JS/TS files. |
| `merge-helper.merge-css`      | Merge CSS        | Merges duplicate rules in CSS files.    |
| `merge-helper.merge-python`   | Merge Python     | Merges duplicate blocks in Python files.|

## Contributions

Suggestions and contributions are always welcome. If you find a problem or have an idea to improve the extension, please open an issue in the GitHub repository.

## Estructura

```
.vscode/
├───extensions.json
├───launch.json
├───settings.json
└───tasks.json
src/
├───extension.ts
├───merge.ts
├───parsers/
│   ├───cssParser.ts
│   ├───genericParser.ts
│   ├───index.ts
│   ├───javascriptParser.ts
│   ├───pythonParser.ts
│   └───types.ts
└───utils/
    ├───cssTextUtils.ts
    ├───detectBlocks.ts
    ├───pythonBlockUtils.ts
    ├───rangeUtils.ts
    └───textUtils.ts
test/
├───test.css
├───test.js
└───test.py
.gitignore
.vscodeignore
CHANGELOG.md
eslint.config.mjs
package-lock.json
package.json
README.md
tsconfig.json

```