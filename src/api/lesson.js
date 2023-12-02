'use strict';
const {Router} = require(`express`);
const {HttpCode} = require(`../constants`);
const {validateLessonsFilter, validateLessonBody, validateTeachersId} = require(`../middleware`);

const route = new Router();

module.exports = (app, [lessonService, teacherService]) => {
  app.use(`/lesson`, route);

  route.get(`/`, validateLessonsFilter, async (req, res) => {
    const filter = res.locals.lessonFilter;
    const lessons = await lessonService.findAll(filter);
    res.status(HttpCode.OK).json(lessons);
  });

  route.post(`/`, [
    validateTeachersId(teacherService),
    validateLessonBody,
  ], async (req, res) => {
    let lessons;
    const {body} = req;

    if (`firstDate` in body && `lastDate` in body) {
      lessons = await lessonService.createByDateRange(body);
    } else if (
      `firstDate` in body && `lessonsCount` in body
    ) {
      lessons = await lessonService.createByCount(body);
    }

    res.status(HttpCode.CREATED).json(lessons);
  });
};
