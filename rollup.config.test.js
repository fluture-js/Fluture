import entry from 'rollup-plugin-multi-entry';
import istanbul from 'rollup-plugin-istanbul';

const pkg = require('./package.json');

const external =
  Object.keys(pkg.dependencies)
  .concat(Object.keys(pkg.devDependencies))
  .concat(['assert']);

export default {
  input: 'test/*.test.js',
  plugins: [
    entry({exports: false}),
    istanbul({
      sourceMap: true,
      exclude: ['test/*.js', 'node_modules/**/*']
    })
  ],
  external: external,
  sourcemap: 'inline',
  output: {format: 'cjs', file: 'index.test.js'}
};
