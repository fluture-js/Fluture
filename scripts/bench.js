const suite = process.argv[2];
const options = process.argv[3] ? JSON.parse(process.argv[3]) : {};

import(`../bench/${suite}.js`).then(module => (
  module.default(options)
), e => {
  console.error(e.stack);
});
