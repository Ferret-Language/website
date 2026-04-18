---
title: Introduction to Ferret
description: Learn Ferret's current language model and syntax
sidebar:
  order: 1
---

Ferret is a systems language with explicit ownership, predictable control flow, and practical tooling.

## Ownership Model

Ferret makes ownership visible in the type:

- `T` plain value
- `*T` owning pointer
- `&T` shared borrow
- `&mut T` mutable borrow
- `^T` / `^const T` raw pointer forms (unsafe)

## Core Language Features

- structs, enums, unions, interfaces
- optionals (`?T`) and error unions (`E!T`)
- attached methods (`fn Type::Method(...)`)
- arrays (`[N]T`), slices (`[]T`, `[]mut T`), tuples (`(A, B, C)`)
- module imports with `import "pkg/path"`

## Tooling

- `ferret check` for type-checking
- `ferret run` to build and execute
- `ferret test` for unit test functions
- built-in package manager `ferret get`

## Quick Example

```ferret
type Mode enum {
    debug,
    release,
}

fn Label(mode: Mode) -> str {
    if mode == Mode::release {
        return "release"
    }
    return "debug"
}

fn main() {
    let mode = Mode::debug
    println("mode:")
    println(Label(mode))
}
```
