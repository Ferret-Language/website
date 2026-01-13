---
title: Match Expressions
description: Pattern matching in Ferret
sidebar:
  order: 3
---

Match expressions provide powerful pattern matching capabilities.

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

## Match with Values

Match expressions return values:

```ferret
let message := match status {
    200 => "Success",
    404 => "Not Found",
    _ => "Error",
};
```

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

## Next Steps

- [Learn about Functions](/functions)
- [Explore Enums](/enums)
