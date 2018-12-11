# Building a Simple Virtual DOM from Scratch

Please read the article about the talk [here](https://dev.to/ycmjason/building-a-simple-virtual-dom-from-scratch-3d05).

Codesandbox demo: https://codesandbox.io/s/github/ycmjason-talks/2018-11-21-manc-web-meetup-4

## To run

```
> npm install
> npm run dev
```

## The bug

The bug that we saw in the presentation was at `src/vdom/diff.js` line 40. We were doing this before:

```js
  const childPatches = [];
  for (const [oldVChild, newVChild] of zip(oldVChildren, newVChildren)) {
    childPatches.push(diff(oldVChild, newVChild));
  }
```

The problem with this is we are not doing `diff(newVChidlren, undefined)`. So `diff(oldVChild, undefined)` is never called. So we were missing some patches for removing the old children.

A quick fix is to replace the following lines with
```js
  const childPatches = [];
  oldVChildren.forEach((oldVChild, i) => {
    childPatches.push(diff(oldVChild, newVChildren[i]));
  });
```

This make sure we loop through all `oldVChildren` and add patches for removing stuff.
