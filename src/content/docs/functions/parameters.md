---
title: Parameters
description: Function parameters in Ferret
sidebar:
  order: 2
---

Ferret supports value, reference, move-qualified, default, and variadic parameters.

## Value Parameters

Value parameters copy by default.

```ferret
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}
```

## Reference Parameters

Use `&T` for read-only borrowing and `&mut T` for mutable borrowing.

```ferret
fn sum(values: &[]i32) -> i32 {
    let total := 0;
    for v in values {
        total += v;
    }
    return total;
}

fn push_value(values: &mut []i32, v: i32) {
    append(values, v);
}
```

## Move-Qualified Parameters (`@T`)

Use `@T` when the callee must consume ownership.

```ferret
import "std/fs";

fn close_file(f: @fs::File) {
    f.Close();
}

fn main() {
    let file := fs::Create("out.txt") catch err {
        return;
    };

    close_file(@file);
    // file is moved and no longer usable here
}
```

Rules:
- Callers must pass lvalues with explicit move syntax (`@value`).
- Move-qualified parameters cannot be reference types.
- Variadic parameters cannot be move-qualified.

## Default Parameters

Parameters can declare defaults with `=`.

```ferret
fn connect(host: str = "127.0.0.1", port: i32 = 6379) -> str {
    return host + ":" + port;
}
```

Rules:
- Default parameters must be trailing.
- A default expression cannot reference another parameter.

## Variadic Parameters

Use `...T` for variable argument lists.

```ferret
fn sum(numbers: ...i32) -> i32 {
    let total := 0;
    for n in numbers {
        total += n;
    }
    return total;
}
```

Rules:
- Variadic parameter must be the last parameter.
- Variadic parameters cannot have default values.

## Next Steps

- [Function Basics](/functions/basics)
- [Reference Types](/type-system/references)
- [Borrow Checker](/type-system/borrow-checker)
