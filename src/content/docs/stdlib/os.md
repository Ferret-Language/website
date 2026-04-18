---
title: std/os
description: Platform and runtime environment info
sidebar:
  order: 4
---

`std/os` exposes lightweight runtime info:

- `CPUCount() -> usize`
- `Platform() -> str`
- `Arch() -> str`
- `OSName() -> str`
- `Debug() -> bool`

```ferret
import "std/os"

fn main() {
    println(os::Platform())
    println(os::Arch())
}
```
