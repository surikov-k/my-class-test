'use strict';

const {MAX_LESSON_COUNT} = require(`../constants`);

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
                   GROUP BY lessons.id, lessons.date,
                            lessons.title
                                ${havingClause}
                   ORDER BY lessons.id
                   OFFSET ${(page - 1) * limit} LIMIT ${limit};`;

    const {rows: lessons} = await this._db.query(query);

    return lessons;
  }


  async createWithLastDate(body) {
    const client = await this._db.connect();

    const {
      teacherIds,
      title,
      days,
      firstDate,
      lastDate,
    } = body;

    try {
      await client.query(`BEGIN ISOLATION LEVEL READ COMMITTED`); // Start a transaction

      // Calculate the end date based on the constraints
      const endDate = new Date(
          Math.min(
              new Date(firstDate).getTime() + 365 * 24 * 60 * 60 * 1000, // 1 year
              new Date(lastDate).getTime()
          )
      );

      // Generate an array of dates within the specified range and days
      const dateArray = [];
      let currentDate = new Date(firstDate);
      while (currentDate <= endDate && dateArray.length < MAX_LESSON_COUNT) {
        if (days.includes(currentDate.getDay())) {
          dateArray.push(currentDate.toISOString().split(`T`)[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const lessons = [];

      for (const lessonDate of dateArray) {
        // Insert lesson into the lessons table
        const lessonResult = await client.query(
            `
              INSERT INTO lessons (date, title, status)
              VALUES ($1, $2, 0)
              RETURNING id, date, title, status
          `,
            [lessonDate, title]
        );

        const {id: lessonId} = lessonResult.rows[0];

        // Link teachers to the lesson
        await Promise.all(
            teacherIds.map((teacherId) =>
              client.query(
                  `INSERT INTO lesson_teachers (lesson_id, teacher_id)
               VALUES ($1, $2)`,
                  [lessonId, teacherId]
              )
            )
        );

        // Retrieve lesson details, including teacher names, after linking teachers
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
           WHERE lessons.id = $1
          `,
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

        // Push the lesson details to the array
        lessons.push(lesson);
      }

      await client.query(`COMMIT`); // Commit the transaction

      return lessons;
    } catch (error) {
      await client.query(`ROLLBACK`); // Rollback the transaction in case of an error
      console.error(`Error creating lessons:`, error);
      throw error;
    } finally {
      client.release(); // Release the client back to the pool
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

module.exports = LessonService;


