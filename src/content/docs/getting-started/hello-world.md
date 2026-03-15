---
title: Hello World
description: Your first Ferret program
sidebar:
  order: 3
---

Let's write your first Ferret program!

## Create a File

Create a file named `main.ferr` in your project directory.

```ferret title="run"
// Your first Ferret program
import "std/io"

fn main() i32 {
    let greeting = "Hello, World!"
    io::Println(greeting)
    return 0
}
```

## Run the Program

Compile and run your program:

```bash
ferret run main.ferr
```

## Understanding the Code

Let's break down what's happening:

- `fn main()` - Every Ferret program starts with a `main` function
- `let greeting = "Hello, World!"` - Declares an immutable local value
- `io::Println(greeting)` - Outputs the greeting to the console
- `return 0` - Returns process exit status

## Try It Yourself

Try modifying the program:

```ferret title="run"
import "std/io"

fn greet(name str) str {
    return "Hello, " + name + "!"
}

fn main() i32 {
    let name = "Ferret"
    let message = greet(name)
    io::Println(message)
    return 0
}
```

## Next Steps

- [Learn about Variables & Constants](/basics/variables)
- [Explore the Type System](/type-system/structs)
- [Understand Functions](/functions/basics)