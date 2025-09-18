# Merge Helper

**Merge Helper** is a powerful Visual Studio Code extension that simplifies your workflow by automatically detecting and merging duplicate code blocks, ensuring you always work with the most recent version of your functions, classes, or CSS rules.

Designed to streamline the code refactoring process, especially after a complex version control merge, this extension helps you clean up your code with a single click.

## Features

- **Smart Duplicate Detection**: Intelligently finds duplicate blocks based on their name (e.g., function name, class name, or CSS selector).
- **Keep the Latest Version**: Automatically identifies the last occurrence of a duplicate block and uses it as the definitive version.
- **One-Click Refactoring**: Replaces all old versions of a block with the most recent one, consolidating them at the position of the first occurrence.
- **Multi-Language Support**: Full support for the most common web development and data science languages:
  - **JavaScript** (`.js`)
  - **TypeScript** (`.ts`)
  - **React** (`.jsx`, `.tsx`)
  - **CSS** (`.css`, `.scss`, `.less`)
  - **Python** (`.py`)
- **Easy to Use**: Integrates seamlessly into the editor's context menu for quick and intuitive access.

## How to Use

1.  Open a file in any of the supported languages (e.g., `main.js`, `styles.css`, `script.py`).
2.  Right-click anywhere in the editor to open the context menu.
3.  Select the command corresponding to the language of your file:
    - `Merge JavaScript` for `.js`, `.ts`, `.jsx`, `.tsx` files.
    - `Merge CSS` for `.css`, `.scss`, `.less` files.
    - `Merge Python` for `.py` files.

The extension will analyze the entire file, perform the merge automatically, and display a notification with the result.

## Example

Imagine you have the following duplicate functions in your JavaScript file after a merge:

```javascript
// Old version of the function
function myFunction() {
    console.log("Hello, world!");
}

// ... other code ...

// New version of the function
function myFunction() {
    console.log("Hello, universe!");
    console.log("This is the latest version.");
}
```

After running **Merge JavaScript**, the code will be automatically cleaned up as follows:

```javascript
// The latest version is kept, and the old one is removed.
function myFunction() {
    console.log("Hello, universe!");
    console.log("This is the latest version.");
}

// ... other code ...
```

## Commands

| Command                 | Title           | Description                                      |
| ----------------------- | ---------------- | ------------------------------------------------ |
| `merge-helper.merge-javascript` | Merge JavaScript | Merges duplicate blocks in JS/TS/React files.    |
| `merge-helper.merge-css`      | Merge CSS        | Merges duplicate rules in CSS/SCSS/Less files.   |
| `merge-helper.merge-python`   | Merge Python     | Merges duplicate functions/classes in Python files.|

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Pabl0l/extension-merge-helper/issues).

## License

This extension is licensed under the [MIT License](LICENSE).
