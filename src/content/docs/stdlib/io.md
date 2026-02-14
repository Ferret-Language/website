---
title: "std/io"
description: Input and output operations in Ferret
---

The `std/io` module provides functions for console input/output operations.

## Import

```ferret
import "std/io";
```

## Functions

### Print()
```ferret
fn Print(values: ...Printable)
```
Prints values to stdout without a trailing newline.

```ferret title="example"
import "std/io";

io::Print("Hello ");
io::Print("World");
io::Print(123);
// Output: Hello World123
```

### Println()
```ferret
fn Println(values: ...Printable)
```
Prints values to stdout with a trailing newline. Values are separated by spaces.

```ferret title="example"
import "std/io";

io::Println("Count:", 42);
io::Println("Debug:", true, 3.14);
// Output:
// Count: 42
// Debug: true 3.14
```

### Read()
```ferret
fn Read() -> str ! str
```
Reads a line from stdin and returns it. Returns an error if input fails.

```ferret title="example"
import "std/io";

io::Print("Enter your name: ");
let name := io::Read() catch err {
    io::Println("Input error:", err);
    return;
};
io::Println("Hello,", name);
```

### ReadUnsafe()
```ferret
fn ReadUnsafe() -> str
```
Reads a line from stdin without error handling. Returns empty string if input fails.

```ferret title="example"
import "std/io";

let input := io::ReadUnsafe();
if len(&(input as []char)) > 0 {
    io::Println("You entered:", input);
}
```

### ReadInt()
```ferret
fn ReadInt() -> str ! i32
```
Reads a line from stdin and parses it as a 32-bit integer.

```ferret title="example"
import "std/io";

io::Print("Enter a number: ");
let number := io::ReadInt() catch err {
    io::Println("Invalid number:", err);
    return;
};
io::Println("You entered:", number);
```

### ReadFloat()
```ferret
fn ReadFloat() -> str ! f64
```
Reads a line from stdin and parses it as a 64-bit floating-point number.

```ferret title="example"
import "std/io";

io::Print("Enter a decimal: ");
let decimal := io::ReadFloat() catch err {
    io::Println("Invalid number:", err);
    return;
};
io::Println("You entered:", decimal);
```

### Printf()
```ferret
fn Printf(fmt: str, args: ...Printable)
```
Prints formatted text using `{}` placeholders.

```ferret title="example"
import "std/io";

let name := "Alice";
let age := 25;
io::Printf("Name: {}, Age: {}\n", name, age);
// Output: Name: Alice, Age: 25
```

## Streaming Interfaces

```ferret
type Reader interface {
    Read(maxBytes: i32) -> str ! []byte
};

type Writer interface {
    Write(buf: []byte) -> str ! i32
};

type Closer interface {
    Close()
};

type ReadWriter interface {
    Read(maxBytes: i32) -> str ! []byte,
    Write(buf: []byte) -> str ! i32
};
```

### WriteString()
```ferret
fn WriteString(w: Writer, s: str) -> str ! i32
```

### Copy()
```ferret
fn Copy(dst: Writer, src: Reader, bufSize: i32) -> str ! i64
```

### ReadAll()
```ferret
fn ReadAll(src: Reader, bufSize: i32) -> str ! []byte
```

```ferret title="example"
import "std/fs";
import "std/io";

let file := fs::Create("out.txt") catch err {
    io::Println("Create error:", err);
    return;
};

defer file.Close();

let w: io::Writer = &mut file;
io::WriteString(w, "hello\n") catch err {
    io::Println("Write error:", err);
};
```

## Printable Types

The following types can be printed using I/O functions:

- **Integers**: `i8`, `i16`, `i32`, `i64`, `i128`, `i256`
- **Unsigned**: `u8`, `u16`, `u32`, `u64`, `u128`, `u256`  
- **Floats**: `f32`, `f64`, `f128`, `f256`
- **Text**: `str`, `char`, `byte`
- **Boolean**: `bool`

## Interactive Programs

### Simple Calculator
```ferret title="run"
import "std/io";

fn main() {
    io::Println("Simple Calculator");
    
    io::Print("Enter first number: ");
    let a := io::ReadInt() catch err {
        io::Println("Error:", err);
        return;
    };
    
    io::Print("Enter operator (+, -, *, /): ");
    let op := io::Read() catch err {
        io::Println("Error:", err);
        return;
    };
    
    io::Print("Enter second number: ");
    let b := io::ReadInt() catch err {
        io::Println("Error:", err);
        return;
    };
    
    let result := match op {
        "+" => a + b,
        "-" => a - b,
        "*" => a * b,
        "/" => if b != 0 { a / b } else {
            io::Println("Error: Division by zero");
            return;
        },
        _ => {
            io::Println("Error: Unknown operator");
            return;
        }
    };
    
    io::Printf("{} {} {} = {}\n", a, op, b, result);
}
```

### Number Guessing Game
```ferret title="run"
import "std/io";
import "random";

fn main() {
    let target := random::Range(1, 100);
    let attempts := 0;
    
    io::Println("Guess the number between 1 and 100!");
    
    while true {
        attempts += 1;
        io::Printf("Attempt {}: ", attempts);
        
        let guess := io::ReadInt() catch err {
            io::Println("Please enter a valid number");
            continue;
        };
        
        if guess == target {
            io::Printf("Congratulations! You guessed it in {} attempts!\n", attempts);
            break;
        } else if guess < target {
            io::Println("Too low!");
        } else {
            io::Println("Too high!");
        }
    }
}
```

## Error Handling

Input functions return Result types for robust error handling:

```ferret title="example"
import "std/io";

// Method 1: Match expression
let input := match io::Read() {
    ok(value) => value,
    err(msg) => {
        io::Println("Input failed:", msg);
        return;
    }
};

// Method 2: Catch syntax
let number := io::ReadInt() catch err {
    io::Println("Not a number:", err);
    -1 // default value
};

// Method 3: Error propagation
fn getUserInput() -> str ! i32 {
    io::Print("Enter number: ");
    let num := io::ReadInt() catch err err; // propagate error
    return num;
}
```

## Best Practices

1. **Always handle input errors** - Users can enter invalid data
2. **Use `Printf()` for formatted output** - More readable than concatenation
3. **Prompt before input** - Let users know what you expect
4. **Validate ranges** - Check if numbers are in expected ranges
5. **Use `ReadUnsafe()` sparingly** - Only when you're certain input will be valid

## See Also

- [Error Handling](/docs/advanced/errors) - Learn about Result types and error handling patterns
- [Type System](/docs/type-system/compatibility) - Understanding type conversions
- [Control Flow](/docs/control-flow/match) - Using match expressions for error handling
