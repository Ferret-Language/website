---
title: Anonymous Functions
description: Function literals and callbacks
sidebar:
  order: 3
---

Ferret supports function literals with `=>`.

```ferret
let square = (x: i32) => x * x
let value = square(5)
```

Block form:

```ferret
let describe = (x: i32) => {
    if x > 0 {
        return "positive"
    }
    return "zero-or-negative"
}
```

You can store function values in maps and call them later.
