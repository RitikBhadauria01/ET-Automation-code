import path from 'path';

const env = process.env.NODE_ENV || 'development';
// eslint-disable-next-line import/no-dynamic-require
const config = require(`./${env}`);
const defaults = {
  root: path.join(__dirname, '/..'),
};
export default Object.assign(defaults, config);
