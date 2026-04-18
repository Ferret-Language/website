---
title: Builtins
description: Built-in language operations
sidebar:
  order: 3
---

Common builtins in current compiler:

- `len(...)`
- `println(...)`
- `panic "message"`
- `exit(code)`
- `comptime expr`

Example:

```ferret
fn main() {
    let values: []i32 = []i32{1, 2, 3}
    if len(values) != 3 {
        panic "invalid length"
    }
    println("ok")
}
```
