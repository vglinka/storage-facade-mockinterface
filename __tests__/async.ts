// Copyright (c) 2023-present Vadim Glinka
//
// Licensed under the Apache License, Version 2.0 <LICENSE-APACHE or
// http://www.apache.org/licenses/LICENSE-2.0> or the MIT license
// <LICENSE-MIT or http://opensource.org/licenses/MIT>, at your
// option.

import { createStorage } from 'storage-facade';
import { MockInterface as TestedInterface, getBase, getMockStorage } from '../src/index';

it(`Async: need cleaning before each test (start)`, async () => {
  const storage = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  storage.value = 'data from the previous test';
  await storage.value;

  expect(await storage.value).toEqual('data from the previous test');
});

it(`Async: need cleaning before each test (end)`, async () => {
  const storage = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  expect(await storage.value).toEqual(undefined);
});

it('Async: read/write', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
    name: 'settings',
    delay: [10, 100],
  });

  storage.value = { c: [40, 42] };
  await storage.value;

  expect(await storage.value).toEqual({ c: [40, 42] });

  expect(getMockStorage(storage).get('value')).toEqual({ c: [40, 42] });
});

it('Async: different names', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
    name: 'settings',
  });

  storage.value = 10;
  await storage.value;

  expect(await storage.value).toEqual(10);

  const storage2 = createStorage({
    use: new TestedInterface(),
    name: 'settings2',
  });

  expect(await storage.value).toEqual(10);
  expect(await storage2.value).toEqual(undefined);

  storage2.value = 20;
  await storage2.value;

  expect(await storage.value).toEqual(10);
  expect(await storage2.value).toEqual(20);

  await storage.clear();

  expect(await storage.value).toEqual(undefined);
  expect(await storage2.value).toEqual(20);
});

it(`Async: case-sensitive`, async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.value = 20;
  await storage.value;
  expect(await storage.Value).toEqual(undefined);
  //                   ^

  storage.Value = 30;
  //      ^
  await storage.value;
  expect(await storage.value).toEqual(20);
});

it(`Async: ref problem (need structuredClone)`, async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  // set value
  const a = { c: [40, 42] };
  storage.value = a;
  await storage.value;
  a.c = [30];
  expect(await storage.value).toEqual({ c: [40, 42] });

  // get value
  const b = await storage.value;
  (b as Record<string, unknown>).c = [40];
  expect(await storage.value).toEqual({ c: [40, 42] });

  // Test new session
  const newStorage = createStorage({
    use: new TestedInterface(),
  });

  // get value
  const t = await newStorage.value;
  if (t !== undefined) {
    (t as Record<string, unknown>).c = [90];
    expect(await newStorage.value).toEqual({ c: [40, 42] });
  }
});

it('Async: delete storage', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
    name: 'settings',
  });

  storage.value = 42;
  await storage.value;

  await storage.deleteStorage();

  expect.assertions(1);
  try {
    await storage.value;
  } catch (e) {
    expect((e as Error).message).toMatch('This Storage was deleted!');
  }
});

it(`Async: null and undefined`, async () => {
  const storage = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  storage.value = undefined;
  await storage.value;

  expect(await storage.value).toEqual(undefined);

  storage.value = null;
  await storage.value;

  expect(await storage.value).toEqual(null);
});

it('Async: addDefault', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 9 });
  storage.addDefault({ value: 1, value2: 2 });
  expect(await storage.value).toEqual(1);
  expect(await storage.value2).toEqual(2);

  storage.value = 42;
  await storage.value;
  expect(await storage.value).toEqual(42);

  storage.value = undefined;
  await storage.value;
  expect(await storage.value).toEqual(1);

  storage.value = null;
  await storage.value;
  expect(await storage.value).toEqual(null);
});

it('Async: getDefault', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 2, other: 7 });

  expect(storage.getDefault()).toEqual({ value: 2, other: 7 });
});

it('Async: setDefault', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 2, other: 7 });

  // Replace 'default'
  storage.setDefault({ value: 42 });

  expect(await storage.value).toEqual(42);
  expect(await storage.other).toEqual(undefined);
});

it('Async: clearDefault', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 2, other: 7 });

  storage.clearDefault();

  expect(await storage.value).toEqual(undefined);
  expect(await storage.other).toEqual(undefined);
});

it('Async: delete key', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 2 });

  storage.value = 10;
  await storage.value;

  delete storage.value;
  await storage.value;

  expect(await storage.value).toEqual(2);
  expect(getMockStorage(storage).get('value')).toEqual(undefined);

  storage.newKey = 3;
  await storage.newKey;

  delete storage.newKey;
  await storage.newKey;

  delete storage.newKey;
  await storage.newKey;

  expect(await storage.newKey).toEqual(undefined);
  expect(getMockStorage(storage).get('newKey')).toEqual(undefined);
});

it('Async: clear storage', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 2 });
  storage.value = 4;
  await storage.value;

  expect(getMockStorage(storage).get('value')).toEqual(4);

  await storage.clear();
  storage.clearDefault();

  expect(await storage.value).toEqual(undefined);
  expect(getMockStorage(storage).get('value')).toEqual(undefined);
});

it('Async: size', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 2 });
  storage.value = 4;
  await storage.value;
  storage.other = 3;
  await storage.other;

  expect(getMockStorage(storage).size).toEqual(2);
  expect(await storage.size()).toEqual(2);
});

it('Async: key', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 2 });
  storage.value = 4;
  await storage.value;

  expect(Array.from(getMockStorage(storage))[0][0]).toEqual('value');
  expect(await storage.key(0)).toEqual('value');
});

it('Async: iter', async () => {
  const storage = createStorage({
    use: new TestedInterface(),
  });

  storage.addDefault({ value: 2 });

  storage.value = 4;
  await storage.value;

  storage.other = 5;
  await storage.other;

  const promisesArray = await storage.getEntries();

  const array = promisesArray.map(async (kv) => {
    const [key, value] = await kv;
    return [key, value];
  });

  expect(await Promise.all(array)).toEqual([
    ['value', 4],
    ['other', 5],
  ]);
});

it(`Async: delete key + iteration`, async () => {
  const storage = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  storage.value = 60;
  await storage.value;

  storage.value2 = 50;
  await storage.value2;

  storage.value3 = 40;
  await storage.value3;

  storage.value4 = 30;
  await storage.value4;

  delete storage.value;
  await storage.value;

  delete storage.value3;
  await storage.value3;

  expect(await storage.value).toEqual(undefined);
  expect(await storage.value2).toEqual(50);
  expect(await storage.value3).toEqual(undefined);
  expect(await storage.value4).toEqual(30);

  storage.value5 = 20;
  await storage.value5;
  storage.value = 1;
  await storage.value;
  storage.value6 = 10;
  await storage.value6;
  storage.value8 = 0;
  await storage.value8;
  storage.value7 = 0;
  await storage.value7;

  const array = await storage.getEntries();

  expect(await Promise.all(array)).toEqual([
    ['value2', 50],
    ['value4', 30],
    ['value5', 20],
    ['value', 1],
    ['value6', 10],
    ['value8', 0],
    ['value7', 0],
  ]);
});

it(`Async: initialized`, async () => {
  let base;

  // Read
  const storage = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  base = getBase(storage);
  expect(base.initialized).toEqual(false);

  await storage.value;
  expect(base.initialized).toEqual(true);

  // Write
  const storage2 = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  base = getBase(storage2);
  expect(base.initialized).toEqual(false);

  storage2.value = 10;
  await storage2.value;
  expect(base.initialized).toEqual(true);

  // Clear
  const storage3 = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  base = getBase(storage3);
  expect(base.initialized).toEqual(false);

  await storage3.clear();
  expect(base.initialized).toEqual(true);

  // getEntries
  const storage4 = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  base = getBase(storage4);
  expect(base.initialized).toEqual(false);

  await storage4.getEntries();
  expect(base.initialized).toEqual(true);

  // deleteStorage
  const storage5 = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  base = getBase(storage5);
  expect(base.initialized).toEqual(false);

  await storage5.deleteStorage();
  expect(base.initialized).toEqual(true);

  // size
  const storage6 = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  base = getBase(storage6);
  expect(base.initialized).toEqual(false);

  await storage6.size();
  expect(base.initialized).toEqual(true);

  // key
  const storage7 = createStorage({
    use: new TestedInterface(),
    asyncMode: true,
  });

  base = getBase(storage7);
  expect(base.initialized).toEqual(false);

  await storage7.key(0);
  expect(base.initialized).toEqual(true);
});
