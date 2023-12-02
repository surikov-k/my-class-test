'use strict';

const {Router} = require(`express`);

const lesson = require(`./lesson`);
const {LessonService, TeacherService} = require(`../data-service`);
const db = require(`../lib/db`);

const app = new Router();

(async () => {
  lesson(app, [new LessonService(db), new TeacherService(db)]);
})();

module.exports = app;
