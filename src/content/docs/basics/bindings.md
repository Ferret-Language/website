---
title: "Bindings"
description: "Learn about bindings in Ferret"
sidebar:
  order: 1
---

Ferret has three common binding forms:

- `let` immutable local binding
- `let mut` mutable local binding
- `const` compile-time constant

## `let` and `let mut`

```ferret
let language = "Ferret"
let mut retries = 0
retries = retries + 1
```

Type annotations use `:` when needed:

```ferret
let code: i32 = 200
let mut total: i64 = 0
```

## `const`

`const` is for values that are fixed at compile time.

```ferret
const MAX_CONNECTIONS = 128
const APP_NAME = "ferret-docs"
```

## Mutability On Parameters

```ferret
fn bump(mut x: i32) -> i32 {
    x = x + 1
    return x
}
```

`mut` on a parameter controls the local parameter binding in that function.

## Next

- [Data Types](/basics/types)
- [Operators](/basics/operators)
