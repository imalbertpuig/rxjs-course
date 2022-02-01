import { Component, OnInit } from '@angular/core';
import { Course } from "../model/course";
import { createHttpObservable } from '../common/util';
import { noop } from 'rxjs';
import { interval, Observable, of, timer } from 'rxjs';
import { catchError, delayWhen, map, retryWhen, shareReplay, tap } from 'rxjs/operators';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // beginnerCourses: Course[];
  // advancedCourse: Course[];

  beginnerCourses$: Observable<Course[]>;
  advancedCourses$: Observable<Course[]>;

  constructor() {}

  ngOnInit() {
    // this.imperativeDesign();
    this.reactiveDesign();
  }

  reactiveDesign(): void {
    const http$ = createHttpObservable('/api/courses');

    const courses$: Observable<Course[]> = http$
      .pipe(
        map(res => Object.values(res['payload'])),
      );

    this.beginnerCourses$ = courses$
      .pipe(
        map(courses => courses.filter(course => course.category === 'BEGINNER'),
      );

    this.advancedCourses$ = courses$
      .pipe(
        map(courses => courses.filter(course => course.category === 'ADVANCED'),
      );
  }

  // imperativeDesign(): void {
    // const http$ = createHttpObservable('/api/courses');

    // const courses$ = http$
      // .pipe(
        // map(res => Object.values(res['payload'])),
      // );

    // courses$.subscribe(
      // (courses: Course[]) => {
        // this.beginnerCourses = courses
          // .filter(course => course.category === 'BEGINNER');

        // this.advancedCourses = courses
          // .filter(course => course.category === 'ADVANCED');
      // },
      // noop,
      // () => console.log('completed'),
    // );
  // }
}
