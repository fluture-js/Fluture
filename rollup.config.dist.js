/* global process require */

import node from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

var pkg = require('./package.json');

var banner = `/**
 * Fluture bundled; version ${process.env.VERSION || `${pkg.version} (dirty)`}
 */
`;

var typeref = `/// <reference types="https://cdn.jsdelivr.net/gh/fluture-js/Fluture@${
  process.env.VERSION || pkg.version
}/index.d.ts" />`;

export default [{
  input: 'index.cjs.js',
  plugins: [node(), commonjs({include: 'node_modules/**'})],
  output: {
    banner: banner,
    format: 'iife',
    name: 'Fluture',
    file: 'dist/bundle.js'
  }
}, {
  input: 'index.js',
  plugins: [node(), commonjs({include: 'node_modules/**'})],
  output: {
    banner: `${banner}\n${typeref}\n`,
    format: 'es',
    file: 'dist/module.js'
  }
}];
