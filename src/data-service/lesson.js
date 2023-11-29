'use strict';

class LessonService {
  constructor(lessons) {
    this._lessons = lessons;
  }

  findAll() {
    return this._lessons;
  }

  create(lesson) {
    const newLesson = {
      id: this._lessons.length + 1,
      date: lesson.date,
      title: lesson.title,
      status: lesson.status,
      visitCount: lesson.visitCount,
      students: lesson.students,
      teachers: lesson.teachers
    }
    this._lessons.push(newLesson);
    return newLesson;
  }
}

module.exports = LessonService;
