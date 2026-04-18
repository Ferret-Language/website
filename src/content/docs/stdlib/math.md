---
title: std/math
description: Current math module surface
sidebar:
  order: 5
---

Current `std/math` is minimal.

Available symbols include:

- `Rand() -> f32` (runtime extern)
- `ClampToZero(value: i32) -> i32`

```ferret
import "std/math"

fn main() {
    let v = math::ClampToZero(-10)
    println(v)
}
```
