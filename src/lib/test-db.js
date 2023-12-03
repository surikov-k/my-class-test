"use strict";
require(`dotenv`).config();
const {Pool} = require(`pg`);

const {TEST_DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT} = process.env;

const somethingIsNotDefined = [TEST_DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT].some((it) => it === undefined);

if (somethingIsNotDefined) {
  throw new Error(`One or more environmental variables are not defined`);
}

module.exports = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: TEST_DB_NAME,
  password: DB_PASSWORD,
  port: DB_PORT
});

