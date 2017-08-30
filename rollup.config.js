import buble from 'rollup-plugin-buble';

const pkg = require('./package.json');

const dependencies = {
  'concurrify': 'concurrify',
  'denque': 'Denque',
  'inspect-f': 'inspectf',
  'sanctuary-type-classes': 'sanctuaryTypeClasses',
  'sanctuary-type-identifiers': 'sanctuaryTypeIdentifiers'
};

export default {
  input: 'src/index.js',
  plugins: [buble()],
  external: Object.keys(dependencies),
  globals: dependencies,
  name: 'Fluture',
  output: {format: 'umd', file: pkg.main}
};
