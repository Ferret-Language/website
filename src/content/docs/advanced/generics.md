---
title: Generics
description: Generic functions, methods, named types, and constraints in Ferret
sidebar:
  order: 5
---

Generics let you write reusable code over types without duplicating logic.

## Syntax Overview

- Use angle brackets `<...>` for type parameters.
- Type parameters are supported on functions, methods, and named types.
- Type arguments at call sites are optional when they can be inferred from arguments.
- Explicit type arguments are always allowed.

```ferret
fn identity<T>(value: T) -> T {
    return value;
}

let a := identity(42);           // inferred: T = i32
let b := identity<str>("hello"); // explicit
```

## Generic Functions

Add type parameters right after the function name:

```ferret
constraint numeric = union {
    i32, i64, i128, i256
};

fn add<T: numeric>(a: T, b: T) -> T {
    return a + b;
}

let inferred := add(10, 20);                    // inferred T = i32
let explicit := add<i64>(1 as i64, 2 as i64);  // explicit T = i64
```

If type arguments cannot be inferred, provide them explicitly with `<...>`.

## Generic Methods

```ferret
type Counter struct {
    .Base: i32
};

constraint numeric = union {
    i32, i64, i128, i256
};

fn (c: Counter) add<T: numeric>(x: T, y: T) -> T {
    return x + y;
}

fn main() -> i32 {
    let c := { .Base = 0 } as Counter;
    let a := c.add(10, 20);                   // inferred T = i32
    let b := c.add<i64>(1 as i64, 2 as i64); // explicit T = i64
    return a + (b as i32);
}
```

## Generic Named Types

```ferret
type Pair<T, U> struct {
    .First: T,
    .Second: U
};

let p := { .First = "age", .Second = 30 } as Pair<str, i32>;
```

Only named types are generic. Anonymous types are not generic.

## Constraints

Define reusable constraints with the `constraint` keyword:

```ferret
constraint numeric = union {
    i32, i64, i128, i256
};

constraint writer = interface {
    Write(buf: []byte) -> i32
};

constraint numeric_writer = numeric & writer;
```

### Union Type Sets

Use `union { ... }` for allowed type sets:

```ferret
constraint numeric = union {
    i32, i64, i128, i256
};
```

Union terms are exact matches by default.

### Underlying Type Match (`~`)

Use `~` in union terms to match by underlying type:

```ferret
constraint signed_like = union {
    ~i32, ~i64, ~i128, ~i256
};
```

### Interface Constraints

Use `interface { ... }` when the bound is behavior-based:

```ferret
constraint writer = interface {
    Write(buf: []byte) -> i32
};

fn useWriter<T: writer>(w: T) -> i32 {
    return 0;
}
```

### Combining Constraints

Use `&` for intersection (must satisfy all parts):

```ferret
constraint numeric_writer = numeric & writer;
```

`|` is not supported in constraint expressions. Use `union { ... }` for alternatives and `&` to combine independent requirements.

## Notes

- Constraint declarations are top-level declarations.
- You can reference named constraints inside other constraints.
- Explicit type arguments are always valid, even when inference works.
