'use strict';
const {Router} = require(`express`);
const {HttpCode} = require(`../constants`);
const validateLessonsFilter = require(`../middleware/validate-lessons-filter`);

const route = new Router();

module.exports = (app, service) => {
  app.use(`/lesson`, route);

  route.get(`/`, validateLessonsFilter, async (req, res) => {
    const lessons = await service.findAll();
    res.status(HttpCode.OK).json(lessons);
  });

  route.post(`/`, async (req, res) => {
    const lesson = await service.create(req.body);
    res.status(HttpCode.CREATED).json(lesson);
  });
};
