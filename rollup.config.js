var dependencies = {
  'sanctuary-show': 'sanctuaryShow',
  'sanctuary-type-identifiers': 'sanctuaryTypeIdentifiers',
};

export default {
  input: 'index.cjs.js',
  external: Object.keys(dependencies),
  output: {
    format: 'umd',
    file: 'index.cjs',
    name: 'Fluture',
    globals: dependencies,
  },
};
