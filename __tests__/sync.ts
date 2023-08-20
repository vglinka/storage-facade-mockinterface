// Copyright (c) 2023-present Vadim Glinka
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option.

import { createStorage } from 'storage-facade';
import { MockInterface, getMockStorage } from '../src/index';

it('Sync: read/write', () => {
  const storage = createStorage({
    use: new MockInterface(),
    name: 'settings',
    asyncMode: false,
  });

  storage.value = { c: [40, 42] };
  expect(storage.value).toEqual({ c: [40, 42] });

  expect(getMockStorage(storage).get('value')).toEqual({ c: [40, 42] });
});

it('Sync: different names', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
    name: 'settings',
  });

  storage.value = 10;

  expect(storage.value).toEqual(10);

  const storage2 = createStorage({
    use: new MockInterface(),
    asyncMode: false,
    name: 'settings2',
  });

  expect(storage.value).toEqual(10);
  expect(storage2.value).toEqual(undefined);

  storage2.value = 20;

  expect(storage.value).toEqual(10);
  expect(storage2.value).toEqual(20);

  storage.clear();

  expect(storage.value).toEqual(undefined);
  expect(storage2.value).toEqual(20);
});

it(`Sync: case-sensitive`, () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.value = 20;
  expect(storage.Value).toEqual(undefined);
  //             ^

  storage.Value = 30;
  //      ^
  expect(storage.value).toEqual(20);
});

it(`Sync: ref problem (need structuredClone)`, () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  // set value
  const a = { c: [40, 42] };
  storage.value = a;
  a.c = [30];
  expect(storage.value).toEqual({ c: [40, 42] });

  // get value
  const b = storage.value;
  (b as Record<string, unknown>).c = [40];
  expect(storage.value).toEqual({ c: [40, 42] });

  // Test new session
  const newStorage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  // get value
  const t = newStorage.value;
  if (t !== undefined) {
    (t as Record<string, unknown>).c = [90];
    expect(newStorage.value).toEqual({ c: [40, 42] });
  }
});

it('Sync: addDefault', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 9 });
  storage.addDefault({ value: 1, value2: 2 });
  expect(storage.value).toEqual(1);
  expect(storage.value2).toEqual(2);

  storage.value = 42;
  expect(storage.value).toEqual(42);

  storage.value = undefined;
  expect(storage.value).toEqual(1);

  storage.value = null;
  expect(storage.value).toEqual(null);
});

it('Sync: getDefault', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 2, other: 7 });

  expect(storage.getDefault()).toEqual({ value: 2, other: 7 });
});

it('Sync: setDefault', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 2, other: 7 });

  // Replace 'default'
  storage.setDefault({ value: 42 });

  expect(storage.value).toEqual(42);
  expect(storage.other).toEqual(undefined);
});

it('Sync: clearDefault', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 2, other: 7 });

  storage.clearDefault();

  expect(storage.value).toEqual(undefined);
  expect(storage.other).toEqual(undefined);
});

it('Sync: delete key', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 2 });
  storage.value = 4;
  delete storage.value;

  expect(storage.value).toEqual(2);
  expect(getMockStorage(storage).get('value')).toEqual(undefined);

  storage.newKey = 3;
  delete storage.newKey;
  delete storage.newKey;

  expect(storage.newKey).toEqual(undefined);
  expect(getMockStorage(storage).get('newKey')).toEqual(undefined);
});

it('Sync: clear storage', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 2 });
  storage.value = 4;

  expect(getMockStorage(storage).get('value')).toEqual(4);

  storage.clear();
  storage.clearDefault();

  expect(storage.value).toEqual(undefined);

  expect(getMockStorage(storage).get('value')).toEqual(undefined);
});

it('Sync: size', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 2 });
  storage.value = 4;
  storage.other = 3;

  expect(getMockStorage(storage).size).toEqual(2);
  expect(storage.size()).toEqual(2);
});

it('Sync: key', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 2 });
  storage.value = 4;

  expect(Array.from(getMockStorage(storage))[0][0]).toEqual('value');
  expect(storage.key(0)).toEqual('value');
});

it('Sync: iter', () => {
  const storage = createStorage({
    use: new MockInterface(),
    asyncMode: false,
  });

  storage.addDefault({ value: 2 });
  storage.value = 4;
  storage.other = 5;

  const array = storage //
    .entries()
    .map(([key, value]) => {
      return [key, value];
    });

  expect(array).toEqual([
    ['value', 4],
    ['other', 5],
  ]);
});
