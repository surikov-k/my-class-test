'use strict';

const express = require(`express`);
const request = require(`supertest`);
const db = require(`../lib/test-db`);

const lesson = require(`./lesson`);
const {LessonService, TeacherService} = require(`../data-service`);
// const {newDb} = require(`pg-mem`);

// const {Pool} = newDb().adapters.createPg();
// const pool = new Pool({});

describe(`Lesson API`, () => {
  let app;

  beforeAll(() => {
    const lessonService = new LessonService(db);
    const teacherService = new TeacherService(db);

    app = express();
    app.use(express.json());
    lesson(app, [lessonService, teacherService]);
  });


  describe(`GET /lesson`, () => {
    it(`should respond with lessons`, async () => {
      const response = await request(app).get(`/lesson`);

      expect(response.status).toBe(200);
    });
  });
  //
  describe(`POST /lesson`, () => {
    it(`should create lessons`, async () => {
      const response = await request(app)
        .post(`/lesson`)
        .send({
          teacherIds: [1, 2],
          title: `Sample Lesson`,
          days: [0, 1, 3],
          firstDate: `2023-01-01`,
          lastDate: `2023-01-31`,
        });

      expect(response.status).toBe(201);
    });
  });
});
