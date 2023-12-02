'use strict';

const DEFAULT_PORT = 8000;

const API_PREFIX = `/api`;
const LESSONS_PER_PAGE = 5;

const HttpCode = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const MAX_LESSON_TITLE = 30;
const MAX_LESSON_COUNT = 300;

module.exports = {
  API_PREFIX,
  DEFAULT_PORT,
  LESSONS_PER_PAGE,
  MAX_LESSON_TITLE,
  MAX_LESSON_COUNT,
  HttpCode
};
