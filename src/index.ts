// Copyright (c) 2023-present Vadim Glinka
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option.

/* eslint-disable
    @typescript-eslint/no-unused-vars,
    class-methods-use-this,
*/

import {
  StorageInterface,
  type Setup,
  type StorageFacade,
  type Base,
  defaultStorageName,
  Ok,
} from 'storage-facade';

interface DelaySetup {
  resolve?: { data: unknown };
  reject?: { data: unknown };
  action?: () => void;
  delay?: number;
}

export const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export class MockInterface extends StorageInterface {
  interfaceName = 'MockInterface';

  storageName = '';

  private isDeleted = false;

  storage: Map<string, unknown> = new Map<string, unknown>();

  checkStorage(): void {
    if (this.isDeleted) throw Error('Storage is deleted');
  }

  // Sync
  initSync<T extends StorageInterface>(setup: Setup<T>): Error | Ok {
    this.storageName = setup.name ?? defaultStorageName;
    return new Ok();
  }

  getItemSync(key: string): unknown {
    this.checkStorage();
    return structuredClone(this.storage.get(key));
  }

  setItemSync(key: string, value: unknown): void {
    this.checkStorage();
    this.storage.set(key, structuredClone(value));
  }

  removeItemSync(key: string): void {
    this.checkStorage();
    this.storage.delete(key);
  }

  clearSync(): void {
    this.checkStorage();
    this.storage.clear();
  }

  sizeSync(): number {
    this.checkStorage();
    return this.storage.size;
  }

  keySync(index: number): string {
    this.checkStorage();
    return Array.from(this.storage)[index][0];
  }

  deleteStorageSync(): void {
    this.checkStorage();
    this.isDeleted = true;
  }

  // Async
  private async wait(setup: DelaySetup): Promise<unknown> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.isDeleted) reject(Error('Storage is deleted'));
        const bothSet = setup.resolve !== undefined && setup.reject !== undefined;
        const bothNotSet = setup.resolve === undefined && setup.reject === undefined;
        if (bothSet || bothNotSet)
          throw Error(`'wait({...})': Use 'resolve' OR 'reject'!`);
        setup.action?.();
        if (setup.resolve !== undefined) resolve(setup.resolve.data);
        if (setup.reject !== undefined) reject(setup.reject.data);
      }, setup.delay ?? randomInRange(10, 100));
    });
  }

  async initAsync<T extends StorageInterface>(setup: Setup<T>): Promise<Error | Ok> {
    return this.wait({
      action: () => {
        this.storageName = setup.name ?? defaultStorageName;
      },
      resolve: { data: new Ok() },
    }) as Promise<Error | Ok>;
  }

  async getItemAsync(key: string): Promise<Error | unknown> {
    return this.wait({
      resolve: { data: structuredClone(this.storage.get(key)) },
    });
  }

  async setItemAsync(key: string, value: unknown): Promise<Error | Ok> {
    return this.wait({
      action: () => {
        this.storage.set(key, structuredClone(value));
      },
      resolve: { data: new Ok() },
    }) as Promise<Error | Ok>;
  }

  async removeItemAsync(key: string): Promise<Error | Ok> {
    return this.wait({
      action: () => {
        this.storage.delete(key);
      },
      resolve: { data: new Ok() },
    }) as Promise<Error | Ok>;
  }

  async clearAsync(): Promise<Error | Ok> {
    return this.wait({
      action: () => {
        this.storage.clear();
      },
      resolve: { data: new Ok() },
    }) as Promise<Error | Ok>;
  }

  async sizeAsync(): Promise<Error | number> {
    return this.wait({
      resolve: { data: this.storage.size },
    }) as Promise<Error | number>;
  }

  async keyAsync(index: number): Promise<Error | string | undefined> {
    return this.wait({
      resolve: { data: Array.from(this.storage)[index][0] },
    }) as Promise<Error | string | undefined>;
  }

  async deleteStorageAsync(): Promise<Error | Ok> {
    return this.wait({
      action: () => {
        this.storage.clear();
        this.isDeleted = true;
      },
      resolve: { data: new Ok() },
    }) as Promise<Error | Ok>;
  }
}

// For tests
export const getMockStorage = (storage: StorageFacade): Map<string, unknown> => {
  const base = Object.getPrototypeOf(
    Object.getPrototypeOf(storage)
  ) as Base<MockInterface>;
  return base.storageInterface.storage;
};
