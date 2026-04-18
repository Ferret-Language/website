---
title: Compatibility
description: Type compatibility and explicit conversion
sidebar:
  order: 9
---

Ferret favors explicit conversion.

```ferret
let x: i64 = 42
let y: i32 = x as i32
```

For interfaces and unions, narrowing usually uses `is` checks before use:

```ferret
if value is Name {
    let narrowed: Name = value
    println(narrowed.value)
}
```
