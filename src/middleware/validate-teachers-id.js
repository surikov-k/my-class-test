'use strict';

const {HttpCode} = require(`../constants`);

module.exports = (service) => async (req, res, next) => {
  const {teacherIds} = req.body;

  if (!teacherIds) {
    return next();
  }
  const isAllIdsExist = await service.checkAllIdsExist(teacherIds);

  if (!isAllIdsExist) {
    return res.status(HttpCode.BAD_REQUEST).send({message: `Some of the teachers' IDs do not exist in the database`});
  }
  return next();
};
