---
title: Defer
description: Run cleanup when scope exits
sidebar:
  order: 4
---

Use `defer` for cleanup paths.

```ferret
fn main() {
    println("start")
    defer println("cleanup")
    println("work")
}
```

`defer` is especially useful with resources that expose `Close`/`Release` methods.
