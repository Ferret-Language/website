---
title: Optionals and Error Unions
description: Absence and recoverable errors
sidebar:
  order: 7
---

## Optionals (`?T`)

```ferret
let some: ?i32 = 10
let empty: ?i32 = none

if some != none {
    println(some)
}
```

## Error Unions (`E!T`)

```ferret
type Io error {
    denied
}

fn load(ok: bool) -> Io!i32 {
    if ok {
        return 41
    }
    return Io::denied
}

fn fallback(ok: bool) -> i32 {
    return load(ok) catch -1
}
```
