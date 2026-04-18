---
title: Maps
description: Key-value map types
sidebar:
  order: 8
---

```ferret
type Routes map[str]fn()

fn main() {
    let routes = Routes{
        "+" => () => println("add")
        "-" => () => println("sub")
    }
    routes["+"]()
}
```

Map keys and values are explicitly typed in `map[K]V`.
