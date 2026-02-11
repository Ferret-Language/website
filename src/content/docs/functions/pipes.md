---
title: Pipes
description: Pipe values into function calls with |>
sidebar:
  order: 4
---

Ferret’s pipe operator (`|>`) passes the left-hand value into a function call on the right-hand side.

## Basic Usage

By default, the value is appended as the last argument:

```ferret
import "std/io";

fn add(x: i32, y: i32) -> i32 { return x + y; }

let result := 5 |> add(10); // add(10, 5)
io::Println(result);
```

## Placeholder `_`

Use `_` to control where the piped value goes:

```ferret
import "std/io";

fn add(x: i32, y: i32) -> i32 { return x + y; }

let result := 5 |> add(_, 10); // add(5, 10)
io::Println(result);
```

Only one placeholder is allowed in a pipe stage.

## Chaining

Pipes compose cleanly:

```ferret
fn add(x: i32, y: i32) -> i32 { return x + y; }
fn mul(x: i32, y: i32) -> i32 { return x * y; }

let result := 5 |> add(10) |> mul(2); // mul(add(10, 5), 2)
```

## Optional Parentheses

If you are not passing any extra arguments, the function call can omit parentheses:

```ferret
fn incr(v: i32) -> i32 { return v + 1; }

let x := 0
    |> incr
    |> incr
    |> incr;
```

Once you pass additional arguments, you must use parentheses:

```ferret
let value := 5 |> add(10);      // ok
let other := 5 |> add(_, 10);    // ok
// let bad := 5 |> add 10;       // invalid
```

## Type Rules

- The right-hand side must be a callable (function or function value).
- The piped value must type-check against the target parameter (or placeholder position).
- Only one placeholder (`_`) is allowed per pipe stage.
- You cannot pipe a `void` value into the next stage.

## Next Steps

- [Function Basics](/functions/basics)
- [Parameters](/functions/parameters)
- [Anonymous Functions](/functions/anonymous)
