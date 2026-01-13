---
title: Functions
description: Defining and calling functions in Ferret
sidebar:
  order: 1
---

Functions are reusable blocks of code that perform specific tasks.

## Function Declaration

To declare a function, use the `fn` keyword followed by the function name. Let's define a function that greets a user:

```ferret
import "std/io";

fn greet() {
    io::Println("Hello!");
}
```

## Function Parameters

Functions can take inputs from outside which are called parameters. Parameters are just like variables that are defined in the function signature.

```ferret
import "std/io";

fn greet(name: str) {
    io::Println("Hello, " + name);
}
```

## Calling Functions

```ferret
import "std/io";

let message := greet("World");
io::Println(message);  // Hello, World
```

## Return Types

Functions can return values:

```ferret
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}

let sum := add(5, 3);  // 8
```

## Void Functions

Functions that don't return a value:

```ferret
import "std/io";

fn log_message(msg: str) {
    io::Println("[INFO] " + msg);
}
```

## Unnamed or Anonymous Functions

Functions are first-class values in Ferret and can be assigned to variables or passed as arguments. We can define unnamed functions using the `fn` keyword without a name:

```ferret
let square = fn(x: i32) -> i32 {
    return x * x;
};

let result = square(5);  // 25
```

This allows for greater flexibility in how functions are used and composed. See the [Anonymous Functions](/functions/anonymous) page for detailed examples.

## Next Steps

- [Learn about Parameters](/functions/parameters)
- [Explore Anonymous Functions](/functions/anonymous)
- [Learn about Error Handling](/advanced/errors)
