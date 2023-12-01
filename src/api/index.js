'use strict';

const {Router} = require(`express`);

const lesson = require(`./lesson`);
const {LessonService} = require(`../data-service`);
const db = require(`../lib/db`);

const app = new Router();

(async () => {
  lesson(app, new LessonService(db));
})();

module.exports = app;
