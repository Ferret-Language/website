---
title: Hello World
description: Your first Ferret program
sidebar:
  order: 3
---

Let's write your first Ferret program!

## Create a File

Create a file named `main.fer` in your project directory (folder).:

```ferret title="run"
// Your first Ferret program
import "std/io";

fn main() {
    let greeting: str = "Hello, World!";
    io::Println(greeting);
}
```

## Run the Program

Compile and run your program:

```bash
ferret main.fer
```

The compiler will produce a little program of the same name as your current project folder. So if your project folder is named `hello`, you'll get an executable named `hello` (or `hello.exe` on Windows). Run it like this:

```bash
./hello # On Windows, use: ./hello.exe
```

Or compile with a custom output name:

```bash
ferret -o myapp hello.fer
./myapp
```

## Understanding the Code

Let's break down what's happening:

- `fn main()` - Every Ferret program starts with a `main` function
- `let greeting: str = "Hello, World!";` - Declares a variable with type annotation
- `io::Println(greeting);` - Outputs the greeting to the console

## Try It Yourself

Try modifying the program:

```ferret title="run"
import "std/io";

fn greet(name: str) -> str {
    return "Hello, " + name + "!";
}

fn main() {
    let name: str = "Ferret";
    let message: str = greet(name);
    io::Println(message);
}
```

## Next Steps

- [Learn about Variables & Constants](/basics/variables)
- [Explore the Type System](/type-system/structs)
- [Understand Functions](/functions/basics)