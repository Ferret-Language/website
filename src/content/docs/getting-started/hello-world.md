---
title: Hello World
description: Your first Ferret program
sidebar:
  order: 3
---

Let's write your first Ferret program!

## Create a File

Create a file named `main.fer` in your project directory.

```ferret title="run"
// Your first Ferret program
fn main() {
    println("Hello, World!")
}
```

## Run the Program

Compile and run your program:

```bash
ferret run main.fer
```

## Understanding the Code

Let's break down what's happening:

- `fn main()` - Every Ferret program starts with a `main` function
- `println(greeting)` - Outputs the greeting to the console

## Next Steps

- [Learn about Variables & Constants](/basics/variables)
- [Explore the Type System](/type-system/structs)
- [Understand Functions](/functions/basics)