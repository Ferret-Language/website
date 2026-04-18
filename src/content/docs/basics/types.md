---
title: Data Types
description: Built-in types in current Ferret
sidebar:
  order: 2
---

Ferret currently ships these core primitive types:

- integers: `i8`, `i16`, `i32`, `i64`, `isize`, `u8`, `u16`, `u32`, `u64`, `usize`
- floats: `f32`, `f64`
- text/scalar: `str`, `char`, `bool`, `void`

## Numeric Types

```ferret
let small: i32 = 10
let large: i64 = 5000000000
let ratio: f32 = 0.5
let precise: f64 = 3.1415926535
```

## Text Types

```ferret
let message: str = "hello"
let letter: char = 'h'
let first = (message as []u8)[0]
```

`str` is immutable text. Convert to `[]u8` / `[]char` for element-level access.

## Composite Types

```ferret
let fixed: [3]i32 = [3]i32{1, 2, 3}
let items: []i32 = []i32{1, 2, 3}
let pair: (i32, bool) = (7, true)
let maybe: ?i32 = none
```

## Ownership Forms

- `T` plain value
- `*T` owning pointer
- `&T` / `&mut T` borrowed references
- `^T` / `^const T` raw pointers

## Next

- [Operators](/basics/operators)
- [Structs](/type-system/structs)
