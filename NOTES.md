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

## Functions Described

- interval
- timer
- fromEvent
