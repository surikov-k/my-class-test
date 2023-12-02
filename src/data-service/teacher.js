'use strict';

class TeacherService {
  constructor(db) {
    this._db = db;
  }

  async checkAllIdsExist(ids) {
    const placeholders = ids.map((_, index) => `$${index + 2}`).join(`, `);

    const query = `
    SELECT
      CASE WHEN COUNT(DISTINCT id) = $1 THEN TRUE
      ELSE FALSE
    END AS result
    FROM teachers
    WHERE id IN (${placeholders})`;

    const result = await this._db.query(query, [ids.length, ...ids]);
    return result.rows[0].result;
  }
}

module.exports = TeacherService;
