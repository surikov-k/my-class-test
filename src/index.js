'use strict';
const DEFAULT_PORT = 8000;
const mock = require('../mock');

const express = require('express');
const app = express();
app.use(express.json());

app.get(`/`, (req, res) => res.json(mock));

app.listen(DEFAULT_PORT, () => {
  console.log(`Сервер запущен на ${DEFAULT_PORT} порту`);
});
