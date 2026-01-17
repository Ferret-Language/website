---
title: Match Statements
description: Pattern matching in Ferret
sidebar:
  order: 3
---

Match statements provide powerful pattern matching capabilities for control flow.

## Basic Match

```ferret
import "std/io";

let status := 200;

match status {
    200 => io::Println("OK"),
    404 => io::Println("Not Found"),
    500 => io::Println("Server Error"),
    _ => io::Println("Unknown Status"),
}
```

## Pattern Types

Match supports three types of patterns:

### Value Patterns

Match against specific values:

```ferret
import "std/io";

let code := 42;

match code {
    0 => io::Println("Zero"),
    42 => io::Println("The Answer"),
    100 => io::Println("Century"),
    _ => io::Println("Other"),
}
```

### Type Patterns with `is`

Match against types using the `is` operator:

```ferret
import "std/io";

let value: any = 42;

match value {
    is i32 => io::Println("Integer"),
    is str => io::Println("String"),
    is bool => io::Println("Boolean"),
    _ => io::Println("Unknown type"),
}
```

### Range Patterns with `in`

Match against ranges using the `in` operator:

```ferret
import "std/io";

let score := 85;

match score {
    in 90..=100 => io::Println("A"),
    in 80..=89 => io::Println("B"),
    in 70..=79 => io::Println("C"),
    in 0..=69 => io::Println("F"),
    _ => io::Println("Invalid score"),
}
```

Both `..` (exclusive) and `..=` (inclusive) range operators are supported.

## Pattern Matching with Enums

```ferret
import "std/io";

type Status enum {
    Pending,
    Active,
    Done,
};

let status := Status::Active;

match status {
    Status::Pending => io::Println("Waiting"),
    Status::Active => io::Println("In Progress"),
    Status::Done => io::Println("Complete"),
}
```

## Important Notes

- **Match is a statement**, not an expression - it cannot be used as a value
- All cases must be handled either explicitly or with a wildcard `_` pattern
- The `is` and `in` operators are **only available in match statements**, not in if-else conditions
- For simple value comparisons in if-else, use regular equality operators

## Next Steps

- [Learn about Functions](/functions)
- [Explore Enums](/type-system/enums)
