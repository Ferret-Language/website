---
title: Parameters
description: Value, mutable, and reference parameters
sidebar:
  order: 2
---

```ferret
fn bump(mut x: i32) -> i32 {
    x += 1
    return x
}
```

Borrowed parameters:

```ferret
type Counter struct {
    value: i32
}

fn Counter::Inc(&mut self) {
    self.value += 1
}

fn Read(c: &Counter) -> i32 {
    return c.value
}
```

Use `&T` for read-only borrow and `&mut T` for mutable borrow.
