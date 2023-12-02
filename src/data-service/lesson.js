'use strict';

const {MAX_LESSON_COUNT} = require(`../constants`);

class LessonService {
  constructor(db) {
    this._db = db;
  }

  async findAll(filter) {
    const client = await this._db.connect();
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
                   GROUP BY lessons.id, lessons.date,
                            lessons.title
                                ${havingClause}
                   ORDER BY lessons.id
                   OFFSET ${(page - 1) * limit} LIMIT ${limit};`;

    const {rows: lessons} = await client.query(query);
    client.release();

    return lessons;
  }

  async createByDateRange(body) {
    const {
      teacherIds,
      title,
      days,
      firstDate,
      lastDate,
    } = body;
    const datesRange = generateDateArrayByRange(firstDate, lastDate, days);
    return await this.bulkSave(datesRange, title, teacherIds);
  }

  async createByCount(body) {
    const {
      teacherIds,
      title,
      days,
      firstDate,
      lessonsCount,
    } = body;
    const datesRange = generateDateArrayByCount(firstDate, lessonsCount, days);

    return await this.bulkSave(datesRange, title, teacherIds);
  }


  async bulkSave(datesRange, title, teacherIds) {
    const client = await this._db.connect();

    try {
      await client.query(`BEGIN ISOLATION LEVEL READ COMMITTED`);

      const lessons = [];

      for (const lessonDate of datesRange) {
        // Insert lesson into the lessons table
        const lessonResult = await client.query(
            `INSERT INTO lessons (date, title, status)
           VALUES ($1, $2, $3)
           RETURNING id, date, title, status`,
            [lessonDate, title, 0]
        );

        const lessonId = lessonResult.rows[0].id;

        // Link teachers to the lesson using lessonId
        await Promise.all(
            teacherIds.map(async (teacherId) => {
              await client.query(
                  `INSERT INTO lesson_teachers (lesson_id, teacher_id)
               VALUES ($1, $2)`,
                  [lessonId, teacherId]
              );
            })
        );

        // Retrieve lesson details, including teacher names
        const lessonDetails = await client.query(
            `SELECT lessons.id,
                  lessons.date,
                  lessons.title,
                  lessons.status,
                  teachers.id   AS teacher_id,
                  teachers.name AS teacher_name
           FROM lessons
                    INNER JOIN lesson_teachers ON lessons.id = lesson_teachers.lesson_id
                    INNER JOIN teachers ON lesson_teachers.teacher_id = teachers.id
           WHERE lessons.id = $1`,
            [lessonId]
        );

        // Extract relevant details from the result
        const lesson = {
          id: lessonDetails.rows[0].id,
          date: lessonDetails.rows[0].date,
          title: lessonDetails.rows[0].title,
          status: lessonDetails.rows[0].status,
          visitCount: 0,
          students: [],
          teachers: lessonDetails.rows.map((row) => ({
            id: row.teacher_id,
            name: row.teacher_name,
          })),
        };

        lessons.push(lesson);
      }
      await client.query(`COMMIT`);

      return lessons;
    } catch (error) {
      await client.query(`ROLLBACK`);
      console.error(`Error creating lessons:`, error);
      throw error;
    } finally {
      client.release();
    }
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

function generateDateArrayByRange(firstDate, lastDate, days) {
  const endDate = new Date(lastDate);
  const dateArray = [];

  let currentDate = new Date(firstDate);
  while (currentDate <= endDate && dateArray.length < MAX_LESSON_COUNT) {
    if (days.includes(currentDate.getDay())) {
      dateArray.push(currentDate.toISOString().split(`T`)[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}

function generateDateArrayByCount(firstDate, lessonCount, days) {
  const startDate = new Date(firstDate);

  const dateArray = [];
  let currentDate = startDate;
  console.log(currentDate, lessonCount, days);

  for (let i = 0; i < lessonCount && isDifferenceLessThanYear(startDate, currentDate); i++) {
    if (days.includes(currentDate.getDay())) {
      dateArray.push(currentDate.toISOString().split(`T`)[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}

function isDifferenceLessThanYear(date1, date2) {
  const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000;

  const differenceInMilliseconds = Math.abs(date2 - date1);

  return differenceInMilliseconds < oneYearInMilliseconds;
}


module.exports = LessonService;


