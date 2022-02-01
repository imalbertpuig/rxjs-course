import { Observable, Observer } from 'rxjs';

export function createHttpObservable(url: string): Observable<any> {
  return Observable.create(async (observer: Observer<Response>) => {
    try {
      // set no-cors because the proxy is not working
      const response = await fetch(url, {
        mode: `no-cors`,
      });
      const body = await response.json();

      observer.next(body);
      observer.complete();
    } catch (err) {
      observer.error(err);
    }
  });
}

