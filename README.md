# 🔥 MockInterface for Storage facade

Supports sync, async, iteration and default values.
Written in TypeScript.
Uses the [storage-facade](https://www.npmjs.com/package/storage-facade)
library which is provides a single storage API that abstracts over
the actual storage implementation. 

## Installation

```sh
npm install storage-facade storage-facade-mockinterface
```

# Usage

## Storage methods

- `.open()` - async only, returns a promise containing an initialization error or `undefined`
- `.clear()` - removes all key-value pairs from the storage
- `.getEntries()` async only, returns an array of promises to iterate
- `.entries()` sync only, returns an array of key-value pairs
- `.size()` - returns the number of key-value pairs
- `.key(index: number)` - returns the name of the key by its index

The `key` and `size` methods can be used to create custom iterators.

## '...Default' methods

The default values are used if the value in the storage is `undefined`.
Default values are not stored in the storage, but in the instance.
Therefore, all these methods are synchronous (no need to use the `await` keyword):

- `.addDefault(obj)` - adds keys and values from the passed object to the list of default values
- `.setDefault(obj)` - replaces the list of default values with the given object
- `.getDefault()` - returns an object containing default values
- `.clearDefault()` - replaces a list of default values with an empty object

## Examples

### Async read/write/delete

```TypeScript
import { createStorage } from 'storage-facade';
import { MockInterface } from 'storage-facade-mockinterface';

(async () => {
  const storage = createStorage({
    use: new MockInterface(), // Here is your interface
    name: 'settings', // Storage name, optional
  });

  // Make sure the storage was initialized without error
  await storage.open();

  storage.value = { data: [40, 42] };
  // After the assignment, wait for the write operation to complete
  await storage.value; // Successfully written
  
  // Read value
  console.log(await storage.value); // { data: [40, 42] }
  
  // When writing, accesses to first-level keys are intercepted only,
  // so if you need to make changes inside the object,
  // you need to make changes and then assign it to the first level key
  const updatedValue = await storage.value; // Get object
  updatedValue.data = [10, 45]; // Make changes
  storage.value = updatedValue; // Update storage
  await storage.value; // Successfully written

  // Read value
  console.log(
    ((await storage.value) as Record<string, unknown>).data
  ); // [10, 45]
  
  // OR
  const value = (await storage.value) as Record<string, unknown>;
  console.log(value.data); // [10, 45]
  
  // Delete value
  delete storage.value;
  await storage.value; // Successfully deleted
  
  console.log(await storage.value); // undefined
  
  storage.value = 30;
  await storage.value;
  
  console.log(await storage.value); // 30
  
  // Clear storage
  await storage.clear();
  console.log(await storage.value); // undefined
})();
```

### Sync read/write/delete
  
```TypeScript
import { createStorage } from 'storage-facade';
import { MockInterface } from 'storage-facade-mockinterface';

const storage = createStorage({
  use: new MockInterface(), // Here is your interface
  name: 'settings', // Storage name, optional
  asyncMode: false,
  //         ^^^^^
});

// If an initialization error occurs,
// it will be thrown on the first attempt to read/write
try {
  storage.value = { data: [40, 42] };
  console.log(storage.value); // { data: [40, 42] }
  
  // When writing, accesses to first-level keys are intercepted only,
  // so if you need to make changes inside the object,
  // you need to make changes and then assign it to the first level key
  const updatedValue = storage.value; // Get object
  updatedValue.data = [10, 45]; // Make changes
  storage.value = updatedValue; // Update storage, successfully written
  console.log(storage.value.data); // [10, 45]
  
  delete storage.value;
  console.log(storage.value); // undefined
  
  storage.value = 30;
  console.log(storage.value); // 30
  
  storage.clear();
  console.log(storage.value); // undefined
} catch (e) {
  console.error((e as Error).message);
}
```

### Async iteration `.getEntries()`

```TypeScript
import { createStorage } from 'storage-facade';
import { MockInterface } from 'storage-facade-mockinterface';

(async () => {
  const storage = createStorage({
    use: new MockInterface(),
  });

  await storage.open();

  storage.value = 4;
  await storage.value;

  storage.other = 5;
  await storage.other;

  const promisesArray = await storage.getEntries();

  const array = promisesArray.map(async (kv) => {
    const [key, value] = await kv;
    // ... add code here ...
    return [key, value];
  });

  console.log(await Promise.all(array));
  /*
    [
      ['value', 4],
      ['other', 5],
    ]
  */
})();
```

### Sync iteration `.entries()`

```TypeScript
import { createStorage } from 'storage-facade';
import { MockInterface } from 'storage-facade-mockinterface';

const storage = createStorage({
  use: new MockInterface(),
  asyncMode: false,
});

try {
  storage.value = 4;
  storage.other = 5;

  const array = storage
    .entries()
    .map(([key, value]) => {
      // ... add code here ...
      return [key, value];
    });

  console.log(array);
  /*
    [
      ['value', 4],
      ['other', 5],
    ]
  */
} catch (e) {
  console.error((e as Error).message);
}
```

### Async '...Default' methods

```TypeScript
import { createStorage } from 'storage-facade';
import { MockInterface } from 'storage-facade-mockinterface';

(async () => {
  const storage = createStorage({
    use: new MockInterface(),
  });

  await storage.open();

  console.log(await storage.value) // undefined

  storage.addDefault({ value: 9, other: 3 });
  storage.addDefault({ value: 1, value2: 2 });
  
  // Since `storage.value = undefined` the default value is used
  console.log(await storage.value);  // 1
  
  console.log(await storage.value2); // 2
  console.log(await storage.other);  // 3

  storage.value = 42;
  await storage.value;
  // When we set a value other than `undefined`,
  // the default value is no longer used
  console.log(await storage.value); // 42

  storage.value = undefined;
  await storage.value;
  console.log(await storage.value); // 1

  storage.value = null;
  await storage.value;
  console.log(await storage.value); // null
  
  delete storage.value;
  await storage.value;
  console.log(await storage.value); // 1
  
  // getDefault
  console.log(storage.getDefault()); // { value: 1, value2: 2, other: 3 }
  
  // Replace 'default'
  storage.setDefault({ value: 30 });

  console.log(await storage.value); // 30
  console.log(await storage.value2); // undefined
  
  // clearDefault
  storage.clearDefault();
  
  console.log(await storage.value); // undefined
  console.log(await storage.value2); // undefined
})();
```

### Sync '...Default' methods

```TypeScript
import { createStorage } from 'storage-facade';
import { MockInterface } from 'storage-facade-mockinterface';

const storage = createStorage({
  use: new MockInterface(),
  asyncMode: false,
});

try {
  console.log(storage.value) // undefined

  storage.addDefault({ value: 9, other: 3 });
  storage.addDefault({ value: 1, value2: 2 });
  
  // Since `storage.value = undefined` the default value is used
  console.log(storage.value);  // 1
  
  console.log(storage.value2); // 2
  console.log(storage.other);  // 3

  storage.value = 42;
  // When we set a value other than `undefined`,
  // the default value is no longer used
  console.log(storage.value); // 42

  storage.value = undefined;
  console.log(storage.value); // 1

  storage.value = null;
  console.log(storage.value); // null
  
  delete storage.value;
  console.log(storage.value); // 1
  
  // getDefault
  console.log(storage.getDefault()); // { value: 1, value2: 2, other: 3 }
  
  // Replace 'default'
  storage.setDefault({ value: 30 });

  console.log(storage.value); // 30
  console.log(storage.value2); // undefined
  
  // clearDefault
  storage.clearDefault();
  
  console.log(storage.value); // undefined
  console.log(storage.value2); // undefined
} catch (e) {
  console.error((e as Error).message);
}
```

# Limitations

## Use only first level keys when writing

When writing, accesses to first-level keys (like `storage.a =`,
but not `storage.a[0] =` or `storage.a.b =`) are intercepted only,
so if you need to make changes inside the object, you need to make changes
and then assign it to the first level key.

Assigning keys of the second or more levels will not give any effect.

```TypeScript
  // Read
  console.log(storage.value.user.data); // Ok

  // Write
  // Don't do that
  storage.value.user.data = 42; // no effect
```

Instead, use the following approach:

```TypeScript
  // Get object
  const updatedValue = storage.value;
  // Make changes
  updatedValue.user.data = 42;
  // Update storage
  storage.value = updatedValue; // Ок
```

async:

```TypeScript
  // Get object
  const updatedValue = await storage.value;
  // Make changes
  updatedValue.user.data = 42;
  // Update storage
  storage.value = updatedValue; 
  await storage.value // Ок
```

## Don't use banned key names

There is a list of key names that cannot be used because they are the same
as built-in method names: [`open`, `clear`, `size`, `key`, `getEntries`,
`entries`, `addDefault`, `setDefault`, `getDefault`, `clearDefault`].

Use the `keyIsNotBanned` function to check the key if needed.

```TypeScript
import { createStorage, keyIsNotBanned } from 'storage-facade';
import { MockInterface } from 'storage-facade-mockinterface';

const storage = createStorage({
  use: new MockInterface(),
  asyncMode: false,
});

try {
  const myNewKey = 'newKey';
  if (keyIsNotBanned(myNewKey)) {
    storage[myNewKey] = 42;
  }
} catch (e) {
  console.error((e as Error).message);
}
```

## Keys are `string`

Only values of type `string` can be used as keys.

## Values for `...Default` methods

Values for [`addDefault`, `setDefault`] methods
should be of any [structured-cloneable type (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types). 










