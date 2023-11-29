'use strict';

const {Router} = require('express');

const lesson = require('./lesson');
const mock = require('../../mock.json');
const {LessonService} = require("../data-service");

const app = new Router();

(async () => {
  lesson(app, new LessonService(mock));
})();

module.exports = app;
