const DEFAULT_PORT = 8000;

const API_PREFIX = `/api`;
const LESSONS_PER_PAGE = 5;

const HttpCode = {
  OK: 200,
  SUCCESS: 200,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

module.exports = {
  API_PREFIX,
  DEFAULT_PORT,
  HttpCode
}
