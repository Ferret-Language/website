---
title: Operators
description: Arithmetic, comparison, logical, and type operators
sidebar:
  order: 3
---

## Arithmetic

```ferret
let a = 10 + 2
let b = 10 - 2
let c = 10 * 2
let d = 10 / 2
let e = 10 % 3
```

## Comparison

```ferret
let eq = 10 == 10
let ne = 10 != 20
let lt = 10 < 20
let ge = 20 >= 10
```

## Logical

```ferret
let ok = true && !false
let either = false || true
```

## Assignment

```ferret
let mut score = 0
score += 5
score -= 2
score *= 3
```

## Type Operators

```ferret
let wide: i64 = 42
let small: i32 = wide as i32

let token: (i32, bool) = (7, true)
if token[0] is i32 {
    println("ok")
}
```

Use `as` for explicit casts and `is` for type-pattern checks with unions/interfaces.
