'use strict';
const {HttpCode, LESSONS_PER_PAGE} = require(`../constants`);

const validator = {
  date: isDatesValid,
  status: isStatusValid,
  teachersIds: isTeachersIdsValid,
  studentsCount: isStudentsCountValid
};

const formator = {
  date: formatDate,
  status: Number,
  teachersIds: formatTeachersIds,
  studentsCount: formatStudentsCount
};


module.exports = (req, res, next) => {
  const {query} = req;
  if (!query) {
    return next();
  }

  const filter = {
    limit: Number(query.lessonsPerPage) || LESSONS_PER_PAGE,
    page: Number(query.page) || 1,
  };

  const errors = [];

  Object.keys(query).forEach((key) => {
    if (!validator[key]) {
      return;
    }
    if (!validator[key](query[key])) {
      errors.push(`Query parameter ${key} is not valid`);
      return;
    }
    filter[key] = formator[key](query[key]);
  });

  if (errors.length > 0) {
    return res.status(HttpCode.BAD_REQUEST).send({message: errors});
  }

  res.locals.lessonFilter = filter;

  return next();
};

function formatDate(dateString) {
  let [fromDate, toDate] = dateString.split(`,`);
  toDate = toDate || fromDate;

  const [fromYear, fromMonth, fromDay] = fromDate.split(`-`);
  const [toYear, toMonth, toDay] = toDate.split(`-`);

  return [
    new Date(Date.UTC(fromYear, fromMonth - 1, fromDay)),
    new Date(Date.UTC(toYear, toMonth - 1, toDay)),
  ];
}

function isDatesValid(dateString) {
  let [fromDate, toDate] = formatDate(dateString);
  return !(isNaN(fromDate.getTime()) || isNaN(toDate.getTime()));
}

function isStatusValid(status) {
  return status === `1` || status === `0`;
}

function formatTeachersIds(ids) {
  return ids.split(`,`).map((id) => Number(id));
}

function isTeachersIdsValid(ids) {
  return ids.split(`,`).every((id) => !isNaN(id));
}

function formatStudentsCount(countString) {
  let [fromCount, toCount] = countString.split(`,`);
  toCount = toCount || fromCount;
  return [Number(fromCount), Number(toCount)];
}

function isStudentsCountValid(countString) {
  let [fromCount, toCount] = formatStudentsCount(countString);
  return !isNaN(fromCount) && !isNaN(toCount);
}
