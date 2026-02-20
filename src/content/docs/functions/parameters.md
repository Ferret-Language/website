---
title: Parameters
description: Function parameters in Ferret
sidebar:
  order: 2
---

Ferret supports value, reference, default, and variadic parameters.

## Value Parameters

Value parameters follow Ferret's ownership rules:
- Copy for copyable types (for example `i32`, `bool`, and aggregates of copyable fields)
- Move for non-copyable owned types (for example resource handles, `#T`, dynamic containers, and aggregates containing them)

```ferret
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}
```

```ferret
import "std/fs";

fn close_file(f: fs::File) {
    f.Close();
}

fn main() {
    let file := fs::Create("out.txt") catch err {
        return;
    };

    close_file(file); // file is moved because fs::File is non-copyable
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

Use references when the callee should not take ownership:
- `&T` for shared read-only access
- `&mut T` for mutable access

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
- Variadic arguments use normal value semantics (copyable values copy, non-copyable values move).

## Next Steps

- [Function Basics](/functions/basics)
- [Reference Types](/type-system/references)
- [Borrow Checker](/type-system/borrow-checker)
