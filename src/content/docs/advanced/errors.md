---
title: Error Handling
description: Error unions and catch handlers
sidebar:
  order: 2
---

Ferret uses explicit error unions (`E!T`) instead of implicit exceptions.

```ferret
type Io error {
    denied
}

fn load(ok: bool) -> Io!i32 {
    if ok {
        return 1
    }
    return Io::denied
}

fn read_with_fallback(ok: bool) -> i32 {
    return load(ok) catch -1
}
```

Handler form:

```ferret
let value = load(false) catch |err| {
    println(err)
    0
}
```
