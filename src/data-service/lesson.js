'use strict';

class LessonService {
  constructor(db) {
    this._db = db;
  }

  async findAll() {
    const query = `SELECT * FROM lessons ORDER BY id ASC`;
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

module.exports = LessonService;
