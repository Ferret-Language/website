---
title: References and Pointers
description: Borrowing, owning pointers, and raw pointers
sidebar:
  order: 6
---

Current forms:

- `*T` owning pointer
- `&T` shared borrow
- `&mut T` mutable borrow
- `^T` / `^const T` raw pointers

```ferret
fn set_to_one(x: &mut i32) {
    *x = 1
}
```

Raw pointer use should stay inside `unsafe` blocks and explicit std/mem APIs.
