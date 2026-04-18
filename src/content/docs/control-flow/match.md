---
title: Match
description: Pattern-based branching
sidebar:
  order: 3
---

`match` works well with enums and unions.

```ferret
type Color enum {
    red,
    green,
    blue,
}

fn score(c: Color) -> i32 {
    let out: i32 = match c {
        Color::green => { 2 }
        _ => { 1 }
    }
    return out
}
```

Union pattern check:

```ferret
type Token union {
    i32,
    str,
}

fn from_token(t: Token) -> i32 {
    let out: i32 = match t {
        is i32 => { t }
        _ => { 0 }
    }
    return out
}
```
