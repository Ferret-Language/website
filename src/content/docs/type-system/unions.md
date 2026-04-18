---
title: Unions
description: Values that can hold one of several types
sidebar:
  order: 3
---

```ferret
type Token union {
    i32,
    str,
}

fn score(t: Token) -> i32 {
    if t is i32 {
        return t
    }
    return 0
}
```

Use `is` for narrowing and `as` when explicit casting is needed.
