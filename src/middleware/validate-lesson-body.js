'use strict';

const {HttpCode, MAX_LESSON_TITLE, MAX_LESSON_COUNT} = require(`../constants`);

const validator = {
  title: isTitleValid,
  lessonsCount: isLessonsCountValid,
  days: isDaysOfWeekValid,
  firstDate: isDateValid,
  lastDate: isDateValid,
};

module.exports = async (req, res, next) => {
  const {body} = req;
  const errors = [];

  if (!validateRequestBody(body)) {
    return res.status(HttpCode.BAD_REQUEST).send({message: `Provide either firstDate and lastDate or lastDate and lessonsCount.`});
  }

  Object.keys(body).forEach((key) => {
    if (!validator[key]) {
      return;
    }

    if (!validator[key](body[key])) {
      errors.push(`Body parameter ${key} is not valid`);
    }
  });

  if (errors.length > 0) {
    return res.status(HttpCode.BAD_REQUEST).send({message: errors});
  }

  return next();
};

function isDateValid(dateString) {
  const [fromYear, fromMonth, fromDay] = dateString.split(`-`);
  const date = new Date(Date.UTC(fromYear, fromMonth - 1, fromDay));
  return !isNaN(date.getTime());
}

function isDaysOfWeekValid(arr) {
  const SUNDAY = 0;
  const SATURDAY = 6;
  return Array.isArray(arr) && arr.every((num) => typeof num === `number` && num >= SUNDAY && num <= SATURDAY);
}

function isTitleValid(title) {
  return typeof title === `string` && title.length < MAX_LESSON_TITLE;
}

function isLessonsCountValid(count) {
  return typeof count === `number` && count < MAX_LESSON_COUNT;
}

function validateRequestBody(body) {
  const hasFirstAndLastDate = `firstDate` in body && `lastDate` in body;
  const hasFirstDateAndLessonsCount = `firstDate` in body && `lessonsCount` in body;

  return !((hasFirstAndLastDate && hasFirstDateAndLessonsCount)
    || (!hasFirstAndLastDate && !hasFirstDateAndLessonsCount));

}
