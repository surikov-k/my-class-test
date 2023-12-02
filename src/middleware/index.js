'use strict';
const validateLessonsFilter = require(`./validate-lessons-filter`);
const validateTeachersId = require(`./validate-teachers-id`);
const validateLessonBody = require(`./validate-lesson-body`);

module.exports = {
  validateLessonsFilter,
  validateTeachersId,
  validateLessonBody
};
