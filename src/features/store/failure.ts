import type { StoreCause } from './iap';

/** A store step that could not finish, with its real cause. */
export class StoreFailure extends Error {
  readonly storeCause: StoreCause;
  constructor(cause: StoreCause) {
    super(cause);
    this.name = 'StoreFailure';
    this.storeCause = cause;
  }
}
