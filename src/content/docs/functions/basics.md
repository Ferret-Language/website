---
title: Functions
description: Defining and calling functions
sidebar:
  order: 1
---

Function syntax uses `->` for return types.

```ferret
fn add(a: i32, b: i32) -> i32 {
    return a + b
}

fn log(msg: str) -> void {
    println(msg)
}

fn main() {
    let result = add(2, 3)
    println(result)
}
```
