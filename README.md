# Smart Resource

An observable helper for asynchronous resources

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
