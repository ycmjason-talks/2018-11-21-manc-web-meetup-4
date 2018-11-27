# Building a Simple Virtual DOM from Scratch

I gave a live-coding talk this week at the [Manchester Web Meetup #4](https://www.meetup.com/Manchester-Web-Meetup/events/256037115). I built a virtual DOM from scratch in less than an hour during the talk. It was the most technically complicated talk that I have ever given.

The video of my talk should be uploaded to YouTube soon. This post is basically a typed-out version of my talk. 

Here is the [github repo](https://github.com/ycmjason-talks/2018-11-21-manc-web-meetup-4) and the [codesandbox](https://codesandbox.io/s/github/ycmjason-talks/2018-11-21-manc-web-meetup-4) to the code that I wrote in the talk.

## Side Notes

- This article will prepend all variables with
	- `$` - when referring to real doms, e.g. `$div`, `$el`, `$app`
	- `v` - when referring to virtual doms, e.g. `vDiv`, `vEl`, `vApp`
- This article will be presented like an actual talk with progressive code adding here and there. Each section would have a codesandbox link showing the progress.
- This article is very very long. Probably take you more than half an hour to read. Make sure you got enough time before reading. Or consider watching the video first.
- If you spot any mistakes, please don't hesitate to point them out!

## Overview

- [Background: What is Virtual DOM?](#background)
- [Setup](#setup)
- [createElement](#createElement)
- [render](#render)
  - [Rendering virtual elements](#rendering-velem)
  - [ElementNode and TextNode](#elem-and-text)
  - [Extending render to support TextNode](#extend-rendering-for-textnode)
- [mount](#mount)
- [Let's make our app more interesting](#improve-app)
- [diff](#diff)
  - [diffAttrs](#diffAttrs)
  - [diffChildren](#diffChildren)
- [Make our app more complicated](#further-improve-app)

## Background: What is Virtual DOM? <a name="background"></a>

Virtual DOMs usually refer to **plain objects** representing the actual [DOM]s.

> The Document Object Model (DOM) is a programming interface for HTML documents.

For example, when you do this:

```js
const $app = document.getElementById('app');
```

You will get the DOM for `<div id="app"></div>` on the page. This DOM will have some programming interface for you to control it. For example:

```js
$app.innerHTML = 'Hello world';
```

To make a plain object to represent `$app`, we can write something like this:

```js
const vApp = {
  tagName: 'div',
  attrs: {
    id: 'app',
  },
};
```

### Didn't mention in the talk

There is no strict rule of how the virtual DOM should look like. You can call it `tagLabel` instead of `tagName`, or `props` instead of `attrs`. As soon as it represents the DOM, it is a "virtual DOM".

Virtual DOM will not have any of those programming interface. This is what makes them **lightweight** comparing to actual DOMs. 

However, keep in mind that since DOMs are the fundamental elements of the browser, most browsers must have done some serious optimisation to them. So actual DOMs might not be as slow as many people claim. 

[DOM]: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction

## Setup <a name="setup"></a>

> https://codesandbox.io/s/7wqm7pv476?expanddevtools=1

We start of by creating and going into our project directory. 

```
$ mkdir /tmp/vdommm
$ cd /tmp/vdommm
```
We will then initiate the git repo, create the `.gitignore` file with [gitignorer](https://www.npmjs.com/package/gitignorer) and initiate npm.

```
$ git init
$ gitignore init node
$ npm init -y
```

Let's do out initial commit.
```
$ git add -A
$ git commit -am ':tada: initial commit'
```

Next, install [Parcel Bundler](https://parceljs.org/) the truly zero-configuration bundler. It supports all kinds of file format out of the box. It is always my choice of bundler in live-coding talks.

```
$ npm install parcel-bundler
```
(Fun fact: you no longer need to pass `--save` anymore.)

While this is installing, let's create some files in our project.

**src/index.html**
```html
<html>
  <head>
    <title>hello world</title>
  </head>
  <body>
    Hello world
    <script src="./main.js"></script>
  </body>
</html>
```

**src/main.js**
```js
const vApp = {
  tagName: 'div',
  attrs: {
    id: 'app',
  },
};

console.log(vApp);
```

**package.json**
```js
{
  ...
  "scripts": {
    "dev": "parcel src/index.html", // add this script
  }
  ...
}
```

Now you can spawn the development server by doing:
```
$ npm run dev

> vdommm@0.0.1 dev /private/tmp/vdommm

> parcel src/index.html

  

Server running at http://localhost:1234

Built in 959ms.
```

Going to http://localhost:1234 and you should see hello world on the page and the virtual DOM we defined in the console. If you see them, then you are correctly set up!

## createElement (tagName, options) <a name="createElement"></a>

> https://codesandbox.io/s/n9641jyo04?expanddevtools=1

Most virtual DOM implementation will have this function called `createElement` function, often referred as `h`. These functions will simply return a "virtual element". So let's implement that.

**src/vdom/createElement.js**
```js
export default (tagName, opts) => {
  return {
    tagName,
    attrs: opts.attrs,
    children: opts.children,
  };
};
```

With object destructuring we can write the above like this:

**src/vdom/createElement.js**
```js
export default (tagName, { attrs, children }) => {
  return {
    tagName,
    attrs,
    children,
  };
};
```

We should also allow creating elements without any options, so let's put some default values for out options.


**src/vdom/createElement.js**
```js
export default (tagName, { attrs = {}, children = [] } = {}) => {
  return {
    tagName,
    attrs,
    children,
  };
};
```

Recall the virtual DOM that we created before:

**src/main.js**
```js
const vApp = {
  tagName: 'div',
  attrs: {
    id: 'app',
  },
};

console.log(vApp);
```

It now can be written as:

**src/main.js**
```js
import createElement from './vdom/createElement';

const vApp = createElement('div', {
  attrs: {
    id: 'app',
  },
});

console.log(vApp);
```

Go back to the browser and you should see the same virtual dom as we defined previously. Let's add an image under the `div` sourcing from giphy:

**src/main.js**
```js
import createElement from './vdom/createElement';

const vApp = createElement('div', {
  attrs: {
    id: 'app',
  },
  children: [
    createElement('img', {
      attrs: {
        src: 'https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif',
      },
    }),
  ],
});

console.log(vApp);
```

Go back to the browser and you should see the updated virtual DOM.

### Didn't mention in the talk
Object literals (e.g. `{ a: 3 }`) automatically inherit from `Object`. This means that the object created by object literals will have methods defined in the [`Object.prototype`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/prototype) like `hasOwnProperty`, `toString`, etc. 

We could make our virtual DOM a little bit "purer" by using `Object.create(null)`. This will create a truly plain object that doesn't inherit from `Object` but `null` instead.

**src/vdom/createElement.js**
```js
export default (tagName, { attrs, children }) => {
  const vElem = Object.create(null);

  Object.assign(vElem, {
    tagName,
    attrs,
    children,
  });

  return vElem;
};
```



## render (vNode) <a name="render"></a>

> https://codesandbox.io/s/pp9wnl5nj0?expanddevtools=1

### Rendering virtual elements <a name="rendering-velem"></a>

Now we got a function that generates virtual DOM for us. Next we need a way to translate our virtual DOM to real DOM. Let's define `render (vNode)` which will take in a virtual node and return the corresponding DOM.

**src/vdom/render.js**
```js
const render = (vNode) => {
  // create the element
  //   e.g. <div></div>
  const $el = document.createElement(vNode.tagName);
  
  // add all attributs as specified in vNode.attrs
  //   e.g. <div id="app"></div>
  for (const [k, v] of Object.entries(vNode.attrs)) {
    $el.setAttribute(k, v);
  }

  // append all children as specified in vNode.children
  //   e.g. <div id="app"><img></div>
  for (const child of vNode.children) {
    $el.appendChild(render(child));
  }

  return $el;
};

export default render;
```

The above code should be quite self-explanatory. I am more than happy to explain more tho if there is any request for it.

--- 

### ElementNode and TextNode <a name="elem-and-text"></a>
In real DOM, there are [8 types of nodes](https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType). In this article, we will only look at two types:

1. `ElementNode`, such as `<div>` and `<img>`
2. `TextNode`, plain texts

Our virtual element structure, `{ tagName, attrs, children }`, only represents the `ElementNode` in the DOM. So we need some representation for the `TextNode` as well. We will simply use `String` to represent `TextNode`.

To demonstrate this, let's add some text to our current virtual DOM.

**src/main.js**
```js
import createElement from './vdom/createElement';

const vApp = createElement('div', {
  attrs: {
    id: 'app',
  },
  children: [
    'Hello world', // represents TextNode
    createElement('img', {
      attrs: {
        src: 'https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif',
      },
    }),  // represents ElementNode
  ],
}); // represents ElementNode

console.log(vApp);
```

---

### Extending render to support TextNode <a name="extend-rendering-for-textnode"></a>
As I mentioned, we are considering two types of nodes. The current `render (vNode)` only only renders `ElementNode`. So let's extend `render` so that it supports rendering of `TextNode` too.

We will first rename our existing function `renderElem` as it is what it does. I will also add object destructuring to make the code looks nicer.

**src/vdom/render.js**
```js
const renderElem = ({ tagName, attrs, children}) => {
  // create the element
  //   e.g. <div></div>
  const $el = document.createElement(tagName);
  
  // add all attributs as specified in vNode.attrs
  //   e.g. <div id="app"></div>
  for (const [k, v] of Object.entries(attrs)) {
    $el.setAttribute(k, v);
  }

  // append all children as specified in vNode.children
  //   e.g. <div id="app"><img></div>
  for (const child of children) {
    $el.appendChild(render(child));
  }

  return $el;
};

export default render;
```

Let's redefine `render (vNode)`. We just need to check if `vNode` is a `String`. If it is then we can use `document.createTextNode(string)` to render the `textNode`. Otherwise, just call `renderElem(vNode)`.

**src/vdom/render.js**
```js
const renderElem = ({ tagName, attrs, children}) => {
  // create the element
  //   e.g. <div></div>
  const $el = document.createElement(tagName);
  
  // add all attributs as specified in vNode.attrs
  //   e.g. <div id="app"></div>
  for (const [k, v] of Object.entries(attrs)) {
    $el.setAttribute(k, v);
  }

  // append all children as specified in vNode.children
  //   e.g. <div id="app"><img></div>
  for (const child of children) {
    $el.appendChild(render(child));
  }

  return $el;
};

const render = (vNode) => {
  if (typeof vNode === 'string') {
    return document.createTextNode(vNode);
  }
  
  // we assume everything else to be a virtual element
  return renderElem(vNode);
};

export default render;
```

Now our `render (vNode)` function is capable of rendering two types of virtual nodes:

1. Virtual Elements - created with our `createElement` function
2. Virtual Texts - represented by strings

---

### Render our `vApp`!

Now let's try to render our `vApp` and `console.log` it!

**src/main.js**
```js
import createElement from './vdom/createElement';
import render from './vdom/render';

const vApp = createElement('div', {
  attrs: {
    id: 'app',
  },
  children: [
    'Hello world',
    createElement('img', {
      attrs: {
        src: 'https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif',
      },
    }),
  ],
});

const $app = render(vApp);
console.log($app);
```

Go to the browser and you would see the console showing the DOM for:

```html
<div id="app">
  Hello world
  <img src="https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif">
</div>
```

## mount ($node, $target) <a name="render"></a>

> https://codesandbox.io/s/vjpk91op47

We are now able to create our virtual DOM and render it to real DOM. Next we would need to put our real DOM on the page. 

Let's first create a mounting point for our app. I will replace the `Hello world` on the `src/index.html` with `<div id="app"></div>`. 

**src/index.html**
```html
<html>
  <head>
    <title>hello world</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="./main.js"></script>
  </body>
</html>
```

What we want to do now is to replace this empty `div` with our rendered `$app`. This is super easy to do if we ignore Internet Explorer and Safari. We can just use [`ChildNode.replaceWith`](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/replaceWith).

Let's define `mount ($node, $target)`. This function will simply replace `$target` with `$node` and return `$node`.

**src/vdom/mount.js**
```js
export default ($node, $target) => {
  $target.replaceWith($node);
  return $node;
};
```

Now in our **main.js** simply mount our `$app` to the empty div.

**src/main.js**
```js
import createElement from './vdom/createElement';
import render from './vdom/render';
import mount from './vdom/mount';

const vApp = createElement('div', {
  attrs: {
    id: 'app',
  },
  children: [
    'Hello world',
    createElement('img', {
      attrs: {
        src: 'https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif',
      },
    }),
  ],
});

const $app = render(vApp);
mount($app, document.getElementById('app'));
```

Our app will show on the page now and we should see a cat on the page.

## Let's make our app more interesting <a name="further-improve-app"></a>

> https://codesandbox.io/s/ox02294zo5

Now let's make our app more interesting. We will wrap our `vApp` in a function called `createVApp`. It will then take in a `count` which then the `vApp` will use it.

**src/main.js**
```js
import createElement from './vdom/createElement';
import render from './vdom/render';
import mount from './vdom/mount';

const createVApp = count => createElement('div', {
  attrs: {
    id: 'app',
    dataCount: count, // we use the count here
  },
  children: [
    'The current count is: ',
    String(count), // and here
    createElement('img', {
      attrs: {
        src: 'https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif',
      },
    }),
  ],
});

let count = 0;
const vApp = createVApp(count);
const $app = render(vApp);
mount($app, document.getElementById('app'));
```

Then, we will `setInterval` to increment the count every second and create, render and mount our app again on the page. 


**src/main.js**
```js
import createElement from './vdom/createElement';
import render from './vdom/render';
import mount from './vdom/mount';

const createVApp = count => createElement('div', {
  attrs: {
    id: 'app',
    dataCount: count, // we use the count here
  },
  children: [
    'The current count is: ',
    String(count), // and here
    createElement('img', {
      attrs: {
        src: 'https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif',
      },
    }),
  ],
});

let count = 0;
const vApp = createVApp(count);
const $app = render(vApp);
let $rootEl = mount($app, document.getElementById('app'));

setInterval(() => {
  count++;
  $rootEl = mount(render(createVApp(count)), $rootEl);
}, 1000);
```

Note that I used `$rootEl` to keep track of the root element. So that `mount` knows where to mount our new app.

If we go back to the browser now, we should see the count increment every second by 1 and works perfectly!

We now gain the power to declaratively create our application. The application is rendered predictably and is very very easy to reason about. If you know how things are done in the JQuery way, you will appreciate how much cleaner this approach is.

However, there are a couple of problems with re-rendering the whole application every second:

1. Real DOM are much heavier than virtual DOM. Rendering the whole application to real DOM can be expensive.
2. Elements will lose their states. For example, `<input>` will lose their focus whenever the application re-mount to the page. See live demo [here](https://codesandbox.io/s/6l1v8lwj5k).

We will solve these problems in the next section.

## diff (oldVTree, newVTree)

> https://codesandbox.io/s/0xv007yqnv

Imagine we have a function `diff (oldVTree, newVTree)` which calculate the differences between the two virtual trees; return a `patch` function that takes in the real DOM of `oldVTree` and perform appropriate operations to the real DOM to make the real DOM looks like the `newVTree`. 

If we have that `diff` function, then we could just re-write our interval to become:


**src/main.js**
```js
import createElement from './vdom/createElement';
import render from './vdom/render';
import mount from './vdom/mount';
import diff from './vdom/diff';

const createVApp = count => createElement('div', {
  attrs: {
    id: 'app',
    dataCount: count, // we use the count here
  },
  children: [
    'The current count is: ',
    String(count), // and here
    createElement('img', {
      attrs: {
        src: 'https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif',
      },
    }),
  ],
});

let count = 0;
let vApp = createVApp(count);
const $app = render(vApp);
let $rootEl = mount($app, document.getElementById('app'));

setInterval(() => {
  count++;
  const vNewApp = createVApp(count)
  const patch = diff(vApp, vNewApp);
  
  // we might replace the whole $rootEl,
  // so we want the patch will return the new $rootEl
  $rootEl = patch($rootEl);

  vApp = vNewApp;
}, 1000);
```

So let's try to implement this `diff (oldVTree, newVTree)`. Let's start with some easy cases:

1. `newVTree` is `undefined`
	- we can simply remove the `$node` passing into the `patch` then!
2. They are both TextNode (string)
	- If they are the same string, then do nothing.
	- If they are not, replace `$node` with `render(newVTree)`.
4. One of the tree is TextNode, the other one is ElementNode
	- In that case they are obviously not the same thing, then we will replace `$node` with `render(newVTree)`.
5. `oldVTree.tagName !== newVTree.tagName`
	- we assume that in this case, the old and new trees are totally different.
	- instead of trying to find the differences between two trees, we will just replace the `$node` with `render(newVTree)`.
	- this assumption also exists in react. ([source](https://reactjs.org/docs/reconciliation.html#motivation))
	- > Two elements of different types will produce different trees.

**src/vdom/diff.js**
```js
import render from './render';

const diff = (oldVTree, newVTree) => {
  // let's assume oldVTree is not undefined!
  if (newVTree === undefined) {
    return $node => {
      $node.remove();
      // the patch should return the new root node.
      // since there is none in this case,
      // we will just return undefined.
      return undefined;
    }
  }

  if (typeof oldVTree === 'string' ||
    typeof newVTree === 'string') {
    if (oldVTree !== newVTree) {
      // could be 2 cases:
      // 1. both trees are string and they have different values
      // 2. one of the trees is text node and
      //    the other one is elem node
      // Either case, we will just render(newVTree)!
      return $node => {
	     const $newNode = render(newVTree);
	     $node.replaceWith($newNode);
	     return $newNode;
	   };
    } else {
      // this means that both trees are string
      // and they have the same values
      return $node => $node;
    }
  }

  if (oldVTree.tagName !== newVTree.tagName) {
    // we assume that they are totally different and 
    // will not attempt to find the differences.
    // simply render the newVTree and mount it.
    return $node => {
      const $newNode = render(newVTree);
      $node.replaceWith($newNode);
      return $newNode;
    };
  }

  // (A)
};

export default diff;
```

If the code reaches `(A)`, it implies the following:

1. `oldVTree` and `newVTree` are both virtual elements.
2. They have the same `tagName`.
3. They might have different `attrs` and `children`.

We will implement two functions to deal with the attributes and children separately, namely `diffAttrs (oldAttrs, newAttrs)` and `diffChildren (oldVChildren, newVChildren)`, which will return a patch separately. As we know at this point we are not going to replace `$node`, we can safely return `$node` after applying both patches.


**src/vdom/diff.js**
```js
import render from './render';

const diffAttrs = (oldAttrs, newAttrs) => {
  return $node => {
    return $node;
  };
};

const diffChildren = (oldVChildren, newVChildren) => {
  return $node => {
    return $node;
  };
};

const diff = (oldVTree, newVTree) => {
  // let's assume oldVTree is not undefined!
  if (newVTree === undefined) {
    return $node => {
      $node.remove();
      // the patch should return the new root node.
      // since there is none in this case,
      // we will just return undefined.
      return undefined;
    }
  }

  if (typeof oldVTree === 'string' ||
    typeof newVTree === 'string') {
    if (oldVTree !== newVTree) {
      // could be 2 cases:
      // 1. both trees are string and they have different values
      // 2. one of the trees is text node and
      //    the other one is elem node
      // Either case, we will just render(newVTree)!
      return $node => {
	     const $newNode = render(newVTree);
	     $node.replaceWith($newNode);
	     return $newNode;
	   };
    } else {
      // this means that both trees are string
      // and they have the same values
      return $node => $node;
    }
  }

  if (oldVTree.tagName !== newVTree.tagName) {
    // we assume that they are totally different and 
    // will not attempt to find the differences.
    // simply render the newVTree and mount it.
    return $node => {
      const $newNode = render(newVTree);
      $node.replaceWith($newNode);
      return $newNode;
    };
  }

  const patchAttrs = diffAttrs(oldVTree.attrs, newVTree.attrs);
  const patchChildren = diffChildren(oldVTree.children, newVTree.children);

  return $node => {
    patchAttrs($node);
    patchChildren($node);
    return $node;
  };
};

export default diff;
```

### diffAttrs (oldAttrs, newAttrs) <a name="diffAttrs"></a>

Let's first focus on the `diffAttrs`. It is actually pretty easy. We know that we are going to set everything in `newAttrs`. After setting them, we just need to go through all the keys in `oldAttrs` and make sure they all exist in `newAttrs` too. If not, remove them.

```js
const diffAttrs = (oldAttrs, newAttrs) => {
  const patches = [];

  // setting newAttrs
  for (const [k, v] of Object.entries(newAttrs)) {
    patches.push($node => {
      $node.setAttribute(k, v);
      return $node;
    });
  }

  // removing attrs
  for (const k in oldAttrs) {
    if (!(k in newAttrs)) {
      patches.push($node => {
        $node.removeAttribute(k);
        return $node;
      });
    }
  }
  
  return $node => {
    for (const patch of patches) {
      patch($node);
    }
    return $node;
  };
};
```

Notice how we create a wrapper patch and loop through the `patches` to apply them.

### diffChildren (oldVChildren, newVChildren) <a name="diffChildren"></a>

Children would be a little bit more complicated. We can consider three cases:

1. `oldVChildren.length === newVChildren.length`
	- we can do `diff(oldVChildren[i], newVChildren[i])` 
	  where `i` goes from `0` to `oldVChildren.length`.
2. `oldVChildren.length > newVChildren.length`
	- we can also do `diff(oldVChildren[i], newVChildren[i])`
	   where `i`  goes from `0` to `oldVChildren.length`.
	- `newVChildren[j]` will be `undefined` for `j >= newVChildren.length`
	- But this is fine, because our `diff` can handle `diff(vNode, undefined)`!
3. `oldVChildren.length < newVChildren.length`
	- we can also do `diff(oldVChildren[i], newVChildren[i])`
	   where `i` goes from `0` to `oldVChildren.length`.
	- this loop will create patches for each already existing children
	- we just need to create the remaining additional children i.e. `newVChildren.slice(oldVChildren.length)`.

To conclude, we loop through `oldVChildren` regardless and we will call `diff(oldVChildren[i], newVChildren[i])`.

Then we will render the additional children (if any), and append them to the `$node`.

```js
const diffChildren = (oldVChildren, newVChildren) => {
  const childPatches = [];
  oldVChildren.forEach((oldVChild, i) => {
    childPatches.push(diff(oldVChild, newVChildren[i]));
  });

  const additionalPatches = [];
  for (const additionalVChild of newVChildren.slice(oldVChildren.length)) {
    additionalPatches.push($node => {
      $node.appendChild(render(newVChildren));
      return $node;
    });
  }

  return $parent => {
    // since childPatches are expecting the $child, not $parent,
    // we cannot just loop through them and call patch($parent)
    $parent.childNodes.forEach(($child, i) => {
      childPatches[i]($child);
    });
    
    for (const patch of additionalPatches) {
      patch($parent);
    }
    return $parent;
  };
};
```

I think it is a little bit more elegant if we use the `zip` function.

```js
import render from './render';

const zip = (xs, ys) => {
  const zipped = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    zipped.push([xs[i], ys[i]]);
  }
  return zipped;
};

const diffChildren = (oldVChildren, newVChildren) => {
  const childPatches = [];
  oldVChildren.forEach((oldVChild, i) => {
    childPatches.push(diff(oldVChild, newVChildren[i]));
  });

  const additionalPatches = [];
  for (const additionalVChild of newVChildren.slice(oldVChildren.length)) {
    additionalPatches.push($node => {
      $node.appendChild(render(additionalVChild));
      return $node;
    });
  }

  return $parent => {
    // since childPatches are expecting the $child, not $parent,
    // we cannot just loop through them and call patch($parent)
    for (const [patch, $child] of zip(childPatches, $parent.childNodes)) {
      patch($child);
    }
    
    for (const patch of additionalPatches) {
      patch($parent);
    }
    return $parent;
  };
};
```

### Finalised diff.js

**src/vdom/diff.js**
```js
import render from './render';

const zip = (xs, ys) => {
  const zipped = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    zipped.push([xs[i], ys[i]]);
  }
  return zipped;
};

const diffAttrs = (oldAttrs, newAttrs) => {
  const patches = [];

  // setting newAttrs
  for (const [k, v] of Object.entries(newAttrs)) {
    patches.push($node => {
      $node.setAttribute(k, v);
      return $node;
    });
  }

  // removing attrs
  for (const k in oldAttrs) {
    if (!(k in newAttrs)) {
      patches.push($node => {
        $node.removeAttribute(k);
        return $node;
      });
    }
  }
  
  return $node => {
    for (const patch of patches) {
      patch($node);
    }
    return $node;
  };
};

const diffChildren = (oldVChildren, newVChildren) => {
  const childPatches = [];
  oldVChildren.forEach((oldVChild, i) => {
    childPatches.push(diff(oldVChild, newVChildren[i]));
  });

  const additionalPatches = [];
  for (const additionalVChild of newVChildren.slice(oldVChildren.length)) {
    additionalPatches.push($node => {
      $node.appendChild(render(additionalVChild));
      return $node;
    });
  }

  return $parent => {
    // since childPatches are expecting the $child, not $parent,
    // we cannot just loop through them and call patch($parent)
    for (const [patch, $child] of zip(childPatches, $parent.childNodes)) {
      patch($child);
    }
    
    for (const patch of additionalPatches) {
      patch($parent);
    }
    return $parent;
  };
};

const diff = (oldVTree, newVTree) => {
  // let's assume oldVTree is not undefined!
  if (newVTree === undefined) {
    return $node => {
      $node.remove();
      // the patch should return the new root node.
      // since there is none in this case,
      // we will just return undefined.
      return undefined;
    }
  }

  if (typeof oldVTree === 'string' ||
    typeof newVTree === 'string') {
    if (oldVTree !== newVTree) {
      // could be 2 cases:
      // 1. both trees are string and they have different values
      // 2. one of the trees is text node and
      //    the other one is elem node
      // Either case, we will just render(newVTree)!
      return $node => {
	     const $newNode = render(newVTree);
	     $node.replaceWith($newNode);
	     return $newNode;
	   };
    } else {
      // this means that both trees are string
      // and they have the same values
      return $node => $node;
    }
  }

  if (oldVTree.tagName !== newVTree.tagName) {
    // we assume that they are totally different and 
    // will not attempt to find the differences.
    // simply render the newVTree and mount it.
    return $node => {
      const $newNode = render(newVTree);
      $node.replaceWith($newNode);
      return $newNode;
    };
  }

  const patchAttrs = diffAttrs(oldVTree.attrs, newVTree.attrs);
  const patchChildren = diffChildren(oldVTree.children, newVTree.children);

  return $node => {
    patchAttrs($node);
    patchChildren($node);
    return $node;
  };
};

export default diff;
```

## Make our app more complicated

> https://codesandbox.io/s/mpmo2yy69

Our current app doesn't really make full use of the power of our virtual DOM. To show how powerful our Virtual DOM is, let's make our app more complicated:


**src/main.js**
```js
import createElement from './vdom/createElement';
import render from './vdom/render';
import mount from './vdom/mount';
import diff from './vdom/diff';

const createVApp = count => createElement('div', {
  attrs: {
    id: 'app',
    dataCount: count, // we use the count here
  },
  children: [
    'The current count is: ',
    String(count), // and here
    ...Array.from({ length: count }, () => createElement('img', {
      attrs: {
        src: 'https://media.giphy.com/media/cuPm4p4pClZVC/giphy.gif',
      },
    })),
  ],
});

let vApp = createVApp(0);
const $app = render(vApp);
let $rootEl = mount($app, document.getElementById('app'));

setInterval(() => {
  const n = Math.floor(Math.random() * 10);
  const vNewApp = createVApp(n);
  const patch = diff(vApp, vNewApp);
  
  // we might replace the whole $rootEl,
  // so we want the patch will return the new $rootEl
  $rootEl = patch($rootEl);

  vApp = vNewApp;
}, 1000);
```

Our app now will generate a random number `n` between 0 and 9 and display `n` cat photos on the page. If you go into the dev tools, you will see how we are "intelligently" inserting and removing `<img>` depending on `n`.

## Thank you

If you read all the way up to here, I would like to thank you for taking the time to read the whole thing. It is a very very long read! Please leave a comment if you actually read the whole thing. Love you!
