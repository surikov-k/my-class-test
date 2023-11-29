'use strict';
const {DEFAULT_PORT, HttpCode} = require("./constants");
const port = process.env.PORT || DEFAULT_PORT;
const mock = require('../mock');

const express = require('express');
const app = express();
app.use(express.json());

app.get(`/`, (req, res) => res.json(mock));
app.use((req, res) => res.sendStatus(HttpCode.NOT_FOUND));

app.listen(DEFAULT_PORT, () => {
  console.log(`Сервер запущен на ${port} порту`);
});
