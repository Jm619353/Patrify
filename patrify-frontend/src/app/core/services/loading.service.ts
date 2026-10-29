import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = new BehaviorSubject<number>(0);
  readonly loading$ = this.pending.asObservable().pipe(map((count) => count > 0));

  start(): void {
    this.pending.next(this.pending.value + 1);
  }

  stop(): void {
    this.pending.next(Math.max(this.pending.value - 1, 0));
  }
}
