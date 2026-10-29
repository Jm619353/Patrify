import { Injectable } from '@angular/core';

const PAGE_SIZE_KEY = 'patrify.preferences.pageSize';
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly pageSizeOptions: number[] = [...PAGE_SIZE_OPTIONS];

  get pageSize(): number {
    const stored = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return this.pageSizeOptions.includes(stored) ? stored : 10;
  }

  set pageSize(value: number) {
    if (this.pageSizeOptions.includes(value)) {
      localStorage.setItem(PAGE_SIZE_KEY, String(value));
    }
  }
}
