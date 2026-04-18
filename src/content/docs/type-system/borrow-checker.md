---
title: Borrow Rules
description: Current borrow/lifetime behavior
sidebar:
  order: 10
---

Current compiler checks include:

- mutable borrow exclusivity
- immutable/mutable overlap rejection
- no reference escape to forbidden storage/returns

Example:

```ferret
fn main() {
    let mut x = 10
    let y = &mut x
    *y = 12
    println(*y)
}
```

When borrows overlap illegally, the compiler emits diagnostics at check time.
