/* global process */

import buble from 'rollup-plugin-buble';
import node from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const pkg = require('./package.json');

const banner = `/**
 * Fluture bundled; version ${process.env.VERSION || `${pkg.version} (dirty)`}
 */
`;

export default {
  input: 'src/index.js',
  plugins: [buble(), node(), commonjs({include: 'node_modules/**'})],
  banner: banner,
  name: 'Fluture',
  output: {format: 'iife', file: 'dist/bundle.js'}
};
