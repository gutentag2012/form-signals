# Array Fields

In many cases using arrays in forms is necessary and hard to manage.
You need to keep of the changes to each item and the array itself to know if an item was added, removed or swapped.

## Data Representation

As mentioned before, this library uses a deep signals to represent the data of the form.
Many times, however, it is hard to know if an array item was swapped or changed when looking at the signals value.
To solve this issue, this library associates a unique key with each array item.

::: tip
Some UI libraries like React require a unique key for each item in a list, so the key can be used for that purpose as
well.
:::

When using an object like this:

```ts
const data = {
  friends: [
    {id: '1', name: 'Alice'},
    {id: '2', name: 'Bob'},
  ],
}
```

The corresponding deep signal would look like this:

```ts
const signalData = signal({
  friends: signal([
    {
      key: 0,
      data: signal({
        id: signal('1'),
        name: signal('Alice')
      })
    },
    {
      key: 1,
      data: signal({
        id: signal('2'),
        name: signal('Bob')
      })
    },
  ]),
})
```

## Helper Functions

Since every new entry to an array has to be converted to the special signal syntax,
this library exposes helper functions on the form and field to make it easier to work with arrays.

The following functions are available:

```ts
import {FormLogic} from '@formsignals/form-core';

type FormValues = { array: string[] }
const form = new FormLogic<FormValues>()

// Append a new value to the array
form.pushValueToArray("array", "asd")
// Append a new value to the array at a specific index (shifts the values to the right)
form.pushValueToArrayAtIndex("array", 0, "asd")
// Insert a new value to the array at a specific index (overwrites the value at the index)
form.insertValueInArray("array", 0, "asd")
// Remove a value from the array at a specific index
form.removeValueFromArray("array", 0)
// Move a value from one index to another (shifts the values to the left)
form.moveValueInArray("array", 0, 1)
// Swap the values of two indexes
form.swapValuesInArray("array", 0, 1)
```

An array field has the same functions (you just don't have to pass the first argument, since it is the name of the field
itself) as well as the following functions to operate on array item fields:

```ts
import {FormLogic} from '@formsignals/form-core';

type FormValues = { array: string[] }
const form = new FormLogic<FormValues>()

const field = form.getOrCreateField("array.0")

// Remove the field from the array
field.removeSelfFromArray()
// Move the field to a new index
field.swapSelfInArray(1)
// Swap the field with another field
field.moveSelfInArray(1)
```
