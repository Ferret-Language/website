---
title: Enums
description: Closed sets of named values
sidebar:
  order: 2
---

```ferret
type Mode enum {
    debug,
    release,
}

fn label(m: Mode) -> str {
    if m == Mode::debug {
        return "debug"
    }
    return "release"
}
```

Use `Type::Variant` to reference enum variants.
