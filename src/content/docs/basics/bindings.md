---
title: "Bindings"
description: "Learn about bindings in Ferret"
sidebar:
  order: 1
---

Variables and constants let you store information in your program. If you're coming from languages like C, C++, or Java, you can think of them in a familiar way:

* A **variable** is something that can change.
* A **constant** is something that cannot change.

Ferret follows the same idea, but with one important difference:

> Variables are **immutable by default**.

This means you must explicitly allow changes when you need them.

Ferret provides three ways to declare values: `let`, `let mut`, and `const`. We call them bindings.

## Bindings

### Immutable bindings

Use `let` to create a binding. By default, bindings are **immutable**, meaning their value cannot be changed after assignment.

### Basic Examples

```ferret
let name = "Ferret";
let age = 1;
let score = 10;
```

### Attempting to Reassign

```ferret
let points = 0;
points = 15;  // ERROR: Cannot assign to immutable binding
```

### Mutable bindings

If you want a binding whose value can change or mutate, use `let mut`.

```ferret
let mut points = 0;
points = 15;
points = 30;
```

You should only use `mut` when necessary. This keeps code safer and easier to understand.

## Constants

Constants use `const`. Once a constant gets a value, it cannot change.

```ferret
const PI = 3.14159;
const MAX_RETRIES = 3;
const APP_NAME = "Ferret Compiler";
```

### Why 'const' if 'let' is already immutable?

This is a common question.

Even though `let` bindings are immutable, they are still **runtime values**.

`const` is different:

* It represents a **fixed, compile-time value**
* It is meant for values that are truly constant across the program
* It is often used for configuration, limits, and global definitions

### Attempting to Reassign

```ferret
const VERSION = 1;
VERSION = 2;  // ERROR: Cannot assign to constant
```

## Naming Conventions

To keep code readable:

* Use `snake_case` for bindings: `user_name`, `total_count`
* Use `SCREAMING_SNAKE_CASE` for constants: `MAX_VALUE`, `DEFAULT_PORT`

```ferret
let user_name = "Alice";
let mut total_count = 42;

const DEFAULT_PORT = 8080;
```

## Next Steps

* [Learn about Data Types](/basics/types)
* [Explore Operators](/basics/operators)
