const { build } = require('esbuild');

build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: true,
  minify: process.argv.includes('--production'),
}).catch(() => process.exit(1));
