# RxJS

## What are Streams?

Streams are a sequence of values over time, that’s it.

For example, a number that goes up by 1 every second might have a stream of values that looks like:

```js
/* setInterval is a multivalue stream.
 * It emits values over time and it will never complete, it remains active.
 */

let counter = 0;

setInterval(() => {
  console.log(counter);
  counter++;
}, 1000);

// result: [0,1,2,3,4]

/* setTimeout is similar an API request.
 * The stream is completed after 3 seconds and it will never emit a value again.
 */

setTimeout(() => {
  console.log('finished');
}, 3000);

// result: [0,1,2,3,4]
```

Another stream might be a sequence of x and y positions of mouse click events, like so:

`[(12,34), (345,22), (1,993)]`

We could have a stream for:

- The x,y position of the mouse as it moves around the screen in a HTML5 game.
- The data returned from API requests.
- The chat windows.
- etc.

## What is a RxJS Observable?

It is a new Push system for JavaScript. An Observable is a Producer of multiple values, "pushing" them to Observers (Consumers).

```js
// the dollar at the end means this variable is an rxjs Observable
const inerval$ = interval(1000);
```

The `interval$` variable is not a stream of values yet, it is a definition for a stream of values. Now, we will create a pair of streams of values:

```js
inerval$.subscribe(val => console.log("stream 1 => " + val));
inerval$.subscribe(val => console.log("stream 2 => " + val));
```

## Observable creation

An Observable is different from a Promise.

Whereas a Promise is executed once defined, an Observable does not trigger any request. It triggers the request in response to a subscription.

In the creation process, you must respect the contract. It is formed by `observer.next()`, `observer.complete()` and `observer.error()`.

```js
const http$ = Observable.create(async (observer: Observer<Response>) => {
  try {
    const response = await fetch('http://localhost:9000/api/courses');
    const body = await response.json();

    observer.next(body);
    observer.complete();
  } catch (err) {
    observer.error(err);
  }
});

http$.subscribe(
  (courses => console.log(courses)),
  noop, // 'no operation' is the same than an empty callback () => {}, but more readable
  () => console.log('completed')),
);
```

In the example above, **why are we converting a Promise to an Observable?**

The advantage is that we can use all the RxJS operators to easily combine our HTTP stream with other streams such as, for example, click handlers, timeouts, etc.

## Imperative Design

**It’s a common mistake** subscribe an observable directly and reserve the result in an external variable.

It goes against the entire concept of manipulating and transforming your data in order to get different results, it means that you’re pretty much using promises to get your data and that’s all.

The example below is not wrong at all, but it doesn’t follow the idea of reactive programming, it nests logic inside an observable instead of streaming the data.

Let’s see a common example of how **you shouldn’t do**.

```js
// properties of the class
tasksCompleted: Task[];
tasksPending: Task[];

// subscription inside a method
tasks$.subscribe(
   res => {
        const data = res['payload'];

        this.tasksCompleted = data.filter(task => task.completed);
        this.tasksPending = data.filter(task => !task.completed);
   }
)
```

```html
<h1>Completed Tasks</h1>

<ul>
   <li *ngFor="let task of tasksCompleted">{{ task.name }}<li>
</ul>

<h1>Pending Tasks</h1>

<ul>
   <li *ngFor="let task of tasksPending">{{ task.name }}<li>
</ul>
```

Adding a lot of logic inside a subscribe call is that **it will not scale very well** in complexity.

We will end up in the same situation of a _Callback Hell_ or _Pyramid of Doom_, and this is one of the things that we try to avoid using RxJS because it is an anti-pattern.

<img src="img/callback-hell.png" />


It can cause side effects to your data, and **you have to unsubscribe all your listeners** once Angular destroys the component.

For this reason, avoid to subscribe your observable in the TypeScript file, unless you need to use the result in order to calculate something else.

Even though you can use operators like `tap` to add this result into an external variable without subscribing it there.

## Reactive Design

Reactive programming is a better way to organise your observables, it outputs exactly the data that you are looking for. So **you don’t need subscribe**, create external variables or even face side effects to get your data.

We simply define stream of values using the observables and **transform them using pipes**.

Let’s see the best way to get the same result.

```js
// properties of the class
tasksCompleted$: Observable<Task[]>;
tasksPending$: Observable<Task[]>;

const tasks$: Observable<Task[]> = httpTasks$.pipe(
   map(res => res['payload']))
);

this.tasksCompleted$ = tasks$.pipe(
   map(tasks => tasks.filter(task => task.completed))
);

this.tasksPending$ = tasks$.pipe(
   map(tasks => tasks.filter(task => !task.completed))
);
```


```html
<h1>Completed Tasks</h1>

<ul>
   <li *ngFor="let task of tasksCompleted$ | async">{{ task.name }}<li>
</ul>

<h1>Pending Tasks</h1>

<ul>
   <li *ngFor="let task of tasksPending$ | async">{{ task.name }}<li>
</ul>
```

Angular handles everything if you use the `async` pipe in the template. It subscribes to these observables and retrieves the data and also **unsubscribes from the observable** once the component gets destroyed.

You don’t need to worry about leak of memory leaving a lot of subscribed observables activated in your components.

The reactive approach looks more maintainable. We don't run into the case of nested subscribes and other problems we faced using the Imperative Design.

Anyway, the example above has an issue. We are doing two HTTP requests for the same data using the `async` pipe in the template, and this can be fixed using another RxJS operator: `shareReplay()`.

```js
const tasks$: Observable<Task[]> = httpTasks$.pipe(
   tap(() => console.log('HTTP request executed')),
   map(res => res['payload'])),
   shareReplay()
);
```

## Most Common Functions

- `interval()`
- `timer()`
- `fromEvent()` => Creates an Observable that emits events of a specific type coming from the given event target. The target can be the DOM EventTarget, Node.js EventEmitter, JQuery-like event target, NodeList or HTMLCollection to attach the event handler to.
- `Observable.create()`
- `map()`
- `shareReplay()` => Makes sure that the HTTP response is passed on to each new subscription instead of executing, again, the same HTTP request.
- `tap()` => Used to produce side effects in the observable chain. If we need to update something outside of the Observable chain, for example, updating a variable at the level of the component or using log statements like `console.log`.
- `concat()` => You can think of concat like a line at a ATM, the next transaction (subscription) cannot start until the previous completes!

```js
const source1$ = of(1, 2, 3);
const source2$ = of(4, 5, 6);
const source3$ = of(7, 8, 9);

const result$ = concat(source1$, source2$, source3$);

$result$.subscribe(console.log);
```

- `filter()`
- `fromPromise()`
- `concatMap()` => Waits for the previous Observable to complete before creating the next one.

```js
ngOnInit() {
  this.form = fb.group({
    description: [course.description, Validators.required],
    category: [course.category, Validators.required],
  });

  // Every request is done once the previous one is completed.
  this.form.valueChanges
    .pipe(
      filter(() => this.form.valid), // only send the valid fields
      concatMap(changes => this.saveCourse(changes)),
    )
    .subscribe();
}

saveCourse(changes) {
  return fromPromise(fetch(`/api/course/${this,course.id}`, {
    method: 'PUT',
    body: JSON.stringify(changes),
    headers: {
      'content-type': 'application/json',
    }
  }));
}
```

- `merge()` => The merge strategy is ideal for performing long running operations in parallel and getting the results of each of the operations combined.

```js
ngOnInit() {
  const interval1$ = interval(1000); // 1, 2, 3... every second

  const interval2$ = interval1$.pipe(val => val * 10); // 10, 20, 30... every second

  const result$ = merge(interval1$, interval2$);

  result$.subscribe(console.log); // 0 0, 1 10, 2 20, 3 30... every second
}
```

- `mergeMap()` => Creates an Observable immediately for any source item, all previous Observables are kept alive. Note `flatMap` is an alias for mergeMap and `flatMap` will be removed in RxJS 8.
- `exhaustMap()` => Source items are ignored while the previous Observable is not completed.

```js
ngAfterViewInit() {
  /* Avoids multiple requests every time the user clicks on #saveButton.
   * Until the previous Observable is not completed, the next one is not fired.
   * In this case, it is a better choice than concatMap because concatMap triggers
   * all the requests.
   */
  fromEvent(this.saveButton.nativeElement, 'click')
    .pipe(
      // concatMap(() => this.saveCourse(this.form.value))
      exhaustMap(() => this.saveCourse(this.form.value))
    )
    .subscribe();
}
```

- `debounceTime()` => Emits a notification from the source Observable only after a particular time span has passed without another source emission.
- `distinctUntilChanged()` => If two consecutive values are exactly the same, we oly want to emit one value.
- `switchMap()` => Projects each source value to an Observable whic is merged in the output Observable, emitting values only from the most recently projected Observable. That means, it's going to unsubscribe from the current observable if exists a new one. Then, it will switch to this new one until completes. This process can be repeated _n_ times.
- `startWith()` => First emits its arguments in order, and then any emissions from the source.

```js
import { timer } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

timer(1000)
  .pipe(
    map(() => 'timer emit'),
    startWith('timer start')
  )
  .subscribe(x => console.log(x));

// results:
// "timer start"
// "timer emit"
```

## Unsubscribe an Observable

It is important to unsubscribe all the observables that we create.

```js
const interval1$ = interval(1000);
const sub = interval1$.subscribe(console.log);
setTimeout(() => sub.unsubscribe(), 5000);
```

Take a look to the `AbortController`.

The `AbortController` interface represents a controller object that **allows you to abort one or more Web requests** as and when desired.

## Error Handler Strategy

### 1. The Catch and Replace Error Handling Strategy

Common scenario is when we want to hide the error and return data anyway.

- `catchError()` => It's simply a function that takes in an input Observable, and outputs an Output Observable.

```js
const tasks$: Observable<Task[]> = httpTasks$.pipe(
   tap(() => console.log('HTTP request executed')),
   map(res => res['payload'])),
   shareReplay(),
   catchError(err => of([])
);
```

### 2. The Catch and Rethrow Error Handling Strategy

Common scenario is when we want to show a toast message for the user and to catch the error with the error handler of the system.

- `throwError` => Will create an observable that errors out immediately with this error without ever emitting any value.
- `finalize` => It is going to be executed when these observable here completes or when it arrives out.

```js
const tasks$: Observable<Task[]> = httpTasks$.pipe(
   catchError(err => {
       console.error(err);
       showToast('Error occurred');

       // in this case, Angular will catch the error
       return throwError(err);
   }),
   finalize(() => console.log('Finalize executed...')),
   tap(() => console.log('HTTP request executed')),
   map(res => res['payload'])),
   shareReplay()
);
```

### 3. The Retry Error Handling Strategy

Common scenario is when we attempt a weighted request, and that request might sometimes fail due to excessive load on the server. But sometimes it might succeed if we retry after a couple of seconds.

- `retryWhen()` => This is an Observable that is going to emit an error each time that stream that we are retrying throws an error, whenever the HTTP stream throws an error the stream will finish. It will not complete successfully. This method creates a brand new stream (a brand new HTTP in this case) and it's going to subscribe to that new stream and it will do that successfully until the stream does not error out.
- `delatyWhen()` => Delays the emission of items from the source Observable by a given time span determined by the emissions of another Observable..
- `timer()` => Create an Observable that emits a particular item after a given delay.

```js
const tasks$: Observable<Task[]> = httpTasks$.pipe(
   tap(() => console.log('HTTP request executed')),
   map(res => res['payload'])),
   shareReplay(),
   // retryWhen(errors => errors) // immediately retry
   retryWhen(errors => errors.pipe(
       delayWhen(() => timer(2000))
   ))
);
```

Source: https://blog.angular-university.io/rxjs-error-handling/

## Versus

### concat vs concatMap

The main difference between them is that `concatMap` accepts as a parameter a function that is invoked for every item from its source and that **returns an inner Observable**, mapping each item from its source to an Observable. `concatMap` then calls its callback only when the previous inner Observables completes.

`concat` just accepts a list of Observables and subscribes to them one after another when the previous Observable completes.

### concat vs merge

`merge` can interleave the outputs, while `concat` will first wait for earlier streams to finish before processing later streams.

### Promise vs Observable

Both the Promise and Observable are used to handle async activity in JavaScript. While an Observable can do everything a Promise can, the reverse is not true.

For example, an Observable can emit multiple values over time. A Promise only resolves once. Here some differences:

- **Observables aren't native to JavaScript** but Promises are.

```js
import { Observable } from 'rxjs'
let myObservable = new Observable()

let myPromise = new Promise((reject, resolve) => resolve(1));
```
- **A Promise can't be canceled.** You can cancel an observable by unsubscribing. You can't cancel a Promise.
- **Observables can emit multiple values.** Observables emit streams of data over time. Promises reject/resolve a single event. 

While Observables are seemingly "better" for any use case, there are times where a Promise is more appropriate, especially when your application is async by nature. So, use Promise instead of an Observable, when:

- You need to handle the (future response) event no matter what (no unsubscribe, no cancel: after you subscribe, there will be an answer, 100%, and you will have to handle it, 100%, the code will get executed).
- One Subscription = One Event handling: there will be only one event from the source, so the future response and the completition is the same event.

### Throttling vs Debouncing

- `throttleTime()` => **Throttling** is a way to limit the number of times a function can be called. Perform a function, then drop all the function calls until a certain period of time.
- `throttle()` => It's like `throttleTime`, but the silencing duration is determined by a second Observable.
- `debounceTime()` => **Debouncing** is a way to delay the execution of a function to a later period until there is some ongoing action

## Subject

An RxJS Subject is a special type of Observable that **allows values to be multicasted to many Observers**. While plain Observables are unicast (each subscribed Observer owns an independent execution of the Observable), Subjects are multicast.

A Subject is like an Observable, but can multicast to many Observers. **Subjects are like EventEmitters**: they maintain a registry of many listeners.

**Every Subject is an Observable.** Given a Subject, you can subscribe to it, providing an Observer, which will start receiving values normally. From the perspective of the Observer, it cannot tell whether the Observable execution is coming from a plain unicast Observable or a Subject.

Internally to the Subject, subscribe does not invoke a new execution that delivers values. It simply registers the given Observer in a list of Observers, similarly to how addListener usually works in other libraries and languages.

**Every Subject is an Observer.** It is an object with the methods next(v), error(e), and complete(). To feed a new value to the Subject, just call next(theValue), and it will be multicasted to the Observers registered to listen to the Subject.

```js
import { Subject } from 'rxjs';

const subject = new Subject<number>();

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

subject.next(1);
subject.next(2);

// Logs:
// observerA: 1
// observerB: 1
// observerA: 2
// observerB: 2
```

Since a Subject is an Observer, this also means you may provide a Subject as the argument to the subscribe of any Observable, like the example below shows:

```js
import { Subject, from } from 'rxjs';

const subject = new Subject<number>();

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

const observable = from([1, 2, 3]);

observable.subscribe(subject); // You can subscribe providing a Subject

// Logs:
// observerA: 1
// observerB: 1
// observerA: 2
// observerB: 2
// observerA: 3
// observerB: 3
```

A multicasted Observable uses a Subject under the hood to make multiple Observers see the same Observable execution.

```js
import { from, Subject } from 'rxjs';
import { multicast } from 'rxjs/operators';

const source = from([1, 2, 3]);
const subject = new Subject();
const multicasted = source.pipe(multicast(subject));

// These are, under the hood, `subject.subscribe({...})`:
multicasted.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
multicasted.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});

// This is, under the hood, `source.subscribe(subject)`:
multicasted.connect();
```

Anyway, it's better to as much as possible create our observables using, for example, `Observable.create` or by using some of the many methods available in RxJS: `fromEvent()`, `fromPromise()`, etc.

However if some of those methods are not convenient or if we run into a source of data that is not easily transformable into an observable, or if we are doing the multicasting of one value to multiple separate observable consumers, then we might want to look into the notion of Subject.

```js
const subject = new Subject();

// this observable is emitting the values of the subject
const series$ = subject.asObservable();

series$.subscribe(console.log);

subject.next(1);
subject.next(2);
subject.next(3);
subject.complete();

// Logs:
// 1
// 2
// 3
```

Definetly, we should try to use subjects as little as possible.

## BehaviorSubject

A variant of Subject that requires an initial value and emits its current value whenever it is subscribed to.

In the next example, we are going to subscribe to the subject and we weill receive new values that are made after the subscription, but we will not get access to the previously emitted values.

The Subject here by default has no memory.

```js
const subject = new Subject();

// this observable is emitting the values of the subject
const series$ = subject.asObservable();

series$.subscribe(val => console.log("early sub:" + val));

subject.next(1);
subject.next(2);
subject.next(3);

setTimeout(() => {
  series$.subscribe(val => console.log("late sub:" + val));
  subject.next(4);
}, 3000);

// Logs: It takes only upcoming values
// early sub: 1
// early sub: 2
// early sub: 3
// early sub: 4
// late sub: 4
```

Here it comes `BehaviorSubject`. It is similar to the plan Subject but is also supports late subscriptions.

```js
const subject = new BehaviorSubject(0);

// this observable is emitting the values of the subject
const series$ = subject.asObservable();

series$.subscribe(val => console.log("early sub:" + val));

subject.next(1);
subject.next(2);
subject.next(3);

setTimeout(() => {
  series$.subscribe(val => console.log("late sub:" + val));
  subject.next(4);
}, 3000);

// Logs: It takes one previous value and upcoming values
// early sub: 0
// early sub: 1
// early sub: 2
// early sub: 3
// late sub: 3
// early sub: 4
// late sub: 4
```

Here are more examples of similar Subjects.

|                   | **Each next subscribers receive...**           |
|-------------------|------------------------------------------------|
| `Subject`         | ...only upcoming values                        |
| `BehaviorSubject` | ...one previous value and upcoming values      |
| `ReplaySubject`   | ...all previous values and upcoming values     |
| `AsyncSubject`    | ...the latest value when the stream will close |

In Angular, subjects are a great way to communicate components between them. It is called the **Store Service Pattern**.
