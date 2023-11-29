'use strict';
const {DEFAULT_PORT, HttpCode, API_PREFIX} = require("./constants");
const port = process.env.PORT || DEFAULT_PORT;
const routes = require('./api');

const express = require('express');
const app = express();
app.use(express.json());

app.use(API_PREFIX, routes);

app.use((req, res) => res
  .status(HttpCode.NOT_FOUND)
  .send(`Not found`));

app.listen(DEFAULT_PORT, () => {
  console.log(`Server started on ${port} port`);
});
