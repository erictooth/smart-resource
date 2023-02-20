# Smart Resource

An observable helper for asynchronous resources

## Example

```tsx
import { SmartResource } from "smart-resource";
import { useResourceSnapshot } from "smart-resource/react";

function getTodos(): {title: string;}[] {
  return fetch("https://jsonplaceholder.typicode.com/todos").then(res => res.json());
}

const TodosResource = new SmartResource(getTodos);

function App() {
  const todos = useResourceSnapshot(TodosResource);

  if (!todos.value) {
    return <p>Loading...</p>;
  }

  return <ul>
    {todos.value.map(todo => <li>{todo.title}<li>)}
  </ul>;
}
```

## Installation

`npm install smart-resource`

## Usage

A `SmartResource` takes any function that returns a promise and converts it into an observable that automatically notifies subscribers when a refetch is triggered.

```ts
const RandomNumberResource = new SmartPromise(() => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Math.random());
        }, 1000);
    });
});

const subscriber = RandomNumberResource.subscribe((resource) => {
    console.log(`New random number: ${resource.value}!`);
});

RandomNumberResource.fetch();
RandomNumberResource.fetch();

subscriber.unsubscribe();

RandomNumberResource.fetch();
```

Output:

```
New random number: 0.5081273919151901!
New random number: 0.44005522329031255!
```

### React / Preact

A `useResourceSnapshot` hook is provided to integrate a `SmartResource` into React / Preact’s lifecycle.

```tsx
import { RandomNumberResource } from "./the-previous-example";
import { useResourceSnapshot } from "smart-resource/react";

function RandomNumberGenerator() {
    const randomNumber = useResourceSnapshot(RandomNumberResource);
    return (
        <div>
            <button onClick={() => RandomNumberResource.fetch()}>
                Get a new number
            </button>
            <h1>Number: {randomNumber.value}</h1>
        </div>
    );
}
```
