---
title: Introduction to Ferret
description: Learn the current Ferret compiler model and core syntax
sidebar:
  order: 1
---

Ferret is a modern systems language focused on explicit semantics: ownership, clear control flow, and predictable code generation.

This documentation now targets the **new compiler line** and its current syntax.

### Explicit Ownership
Ferret makes ownership part of type syntax so resource behavior is visible in source.
- `T` = ordinary value type
- `*T` = owning heap pointer
- `&T` = immutable borrowed reference
- `&mut T` = mutable borrowed reference
- `^T` = raw mutable pointer
- `^const T` = raw const pointer

### Practical Type System
Ferret includes structs, enums, interfaces, unions, optionals (`?T`), and error unions (`E!T`) as first-class language features.

### Multi-backend Compilation
The compiler supports LLVM and QBE backends and is being used in browser playground flows through WebAssembly.

### Modules and Imports
Imports are package-root relative and use `::` for imported names, enum variants, and static members.

## Quick Example (Current Syntax)

```ferret title="run"
import "std/io";

type BuildMode enum {
    debug,
    release,
}

fn Name(mode BuildMode) str {
    if mode == BuildMode::release {
        return "release"
    }
    return "debug"
}

fn main() i32 {
    let mode = BuildMode::debug
    io::Println("mode:")
    io::Println(Name(mode))
    return 0
}

```