/* global process Set */

import {readFileSync} from 'fs';
import node from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

var pkg = JSON.parse(readFileSync('package.json', 'utf8'));

var dependencies = pkg => {
  var deps = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.peerDependencies || {}));
  return Array.from(new Set(deps.concat(deps.flatMap(dependency => (
    dependencies(JSON.parse(readFileSync(`node_modules/${dependency}/package.json`, 'utf8')))
  )))));
};

var banner = `/**
 * Fluture bundled; version ${process.env.VERSION || `${pkg.version} (dirty)`}
 */
`;

var footer = `/** Fluture license

${readFileSync('./LICENSE')}*/

${dependencies(pkg).map(dependency => `/** ${dependency} license

${readFileSync(`./node_modules/${dependency}/LICENSE`)}*/`).join('\n\n')}`;

var typeref = `/// <reference types="https://cdn.jsdelivr.net/gh/fluture-js/Fluture@${
  process.env.VERSION || pkg.version
}/index.d.ts" />`;

export default [{
  input: 'index.cjs.js',
  plugins: [node(), commonjs({include: 'node_modules/**'})],
  output: {
    banner: banner,
    footer: footer,
    format: 'iife',
    name: 'Fluture',
    file: 'dist/bundle.js',
  },
}, {
  input: 'index.js',
  plugins: [node(), commonjs({include: 'node_modules/**'})],
  output: {
    banner: `${banner}\n${typeref}\n`,
    footer: footer,
    format: 'es',
    file: 'dist/module.js',
  },
}];
