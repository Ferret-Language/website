---
title: Loops
description: while and for loops in Ferret
sidebar:
  order: 2
---

## `while`

```ferret
fn sum_to(n: i32) -> i32 {
    let mut i = 0
    let mut total = 0
    while i <= n {
        total += i
        i += 1
    }
    return total
}
```

## `for` Over Slices

```ferret
fn sum(values: []i32) -> i32 {
    let mut total = 0
    for values |v| {
        total += v
    }
    return total
}
```
