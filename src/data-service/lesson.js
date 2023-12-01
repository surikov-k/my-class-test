'use strict';

class LessonService {
  constructor(db) {
    this._db = db;
  }

  async findAll(filter) {
    const {page, limit} = filter;
    const whereClause = constructWhereClause(filter);
    const havingClause = constructHavingClause(filter);

    const query = `SELECT lessons.id,
                          lessons.date,
                          lessons.title,
                          lessons.status,
                          CAST(COUNT(CASE WHEN lesson_students.visit THEN 1 END) AS INTEGER) AS "visitCount",
                          COALESCE(
                                  CASE
                                      WHEN COUNT(DISTINCT students.name) > 0
                                          THEN ARRAY_AGG(DISTINCT JSONB_BUILD_OBJECT('name', students.name))
                                      ELSE ARRAY []::JSONB[]
                                      END,
                                  ARRAY []::JSONB[]
                              )                                                              AS students,
                          COALESCE(
                                  CASE
                                      WHEN COUNT(DISTINCT teachers.name) > 0
                                          THEN ARRAY_AGG(DISTINCT JSONB_BUILD_OBJECT('name', teachers.name))
                                      ELSE ARRAY []::JSONB[]
                                      END,
                                  ARRAY []::JSONB[]
                              )                                                              AS teachers
                   FROM lessons
                            FULL JOIN lesson_students ON lessons.id = lesson_students.lesson_id
                            FULL JOIN students ON lesson_students.student_id = students.id
                            FULL JOIN lesson_teachers ON lessons.id = lesson_teachers.lesson_id
                            FULL JOIN teachers ON lesson_teachers.teacher_id = teachers.id
                   ${whereClause}
                   GROUP BY lessons.id, lessons.date, lessons.title
                   ${havingClause}
                   ORDER BY lessons.id
                   OFFSET ${(page - 1) * limit} LIMIT ${limit};`;

    const {rows: lessons} = await this._db.query(query);

    return lessons;
  }

  // db.query(`INSERT INTO lessons (date, title, status, visit_count, students, teachers) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [lesson.date, lesson.title, lesson.status, lesson.visitCount, lesson.students, lesson.teachers])

  // id, date, title, status

  create(lesson) {
    const newLesson = {
      id: this._lessons.length + 1,
      date: lesson.date,
      title: lesson.title,
      status: lesson.status,
      visitCount: lesson.visitCount,
      students: lesson.students,
      teachers: lesson.teachers
    };
    this._lessons.push(newLesson);
    return newLesson;
  }
}

function constructWhereClause({date, status, teachersIds}) {
  const where = [];
  if (date) {
    const [dateFrom, dateTo] = date;
    where.push(`lessons.date BETWEEN '${dateFrom.toISOString()}' AND '${dateTo.toISOString()}'`);
  }

  if (status !== undefined) {
    where.push(`lessons.status = ${status}`);
  }
  if (teachersIds) {
    where.push(`teachers.id IN (${teachersIds.join(`, `)})`);
  }
  return where.length ? `WHERE ${where.join(` AND `)}` : ``;
}
function constructHavingClause({studentsCount}) {
  const having = [];
  if (studentsCount) {
    const [studentsCountFrom, studentsCountTo] = studentsCount;
    having.push(`COUNT(DISTINCT students.id) BETWEEN ${studentsCountFrom} AND ${studentsCountTo}`);
  }
  return having.length ? `HAVING ${having.join(` AND `)}` : ``;
}

module.exports = LessonService;
