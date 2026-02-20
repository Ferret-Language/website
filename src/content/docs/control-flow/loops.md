---
title: Loops
description: Iteration with for and while loops in Ferret
sidebar:
  order: 2
---

Ferret provides several loop constructs for iteration.

## For Loops

### Range-based For Loops

Ferret provides two range operators for loops:

- `..` - **Exclusive end**: loops from start to end-1
- `..=` - **Inclusive end**: loops from start to end

Range expressions follow these forms:

- `start..end[:step]`
- `start..=end[:step]`

`step` is optional and defaults to `1`. Float steps require float endpoints (for example, `0.0..8.0:1.5`). `0..8:1.5` is invalid.

```ferret title="run"
import "std/io";

fn main() {
    // Exclusive: iterates 0 to 9 (10 iterations)
    for i in 0..10 {
        io::Println(i);  // Prints: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    }

    io::Println("-------");

    // Inclusive: iterates 0 to 10 (11 iterations)
    for i in 0..=10 {
        io::Println(i);  // Prints: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    }
}
```

Loop variables are always declared and scoped to the loop body.

The range operators generate arrays, so this is equivalent to:
```ferret title="run"
import "std/io";

fn main() {
    let numbers := 0..10;   // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    let numbers_inc := 0..=10;  // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    for i in numbers {
        io::Println(i);
    }

    io::Println("-------");

    for i in numbers_inc {
        io::Println(i);
    }
}
```

You can specify the step/increment with both operators:
```ferret title="run"
import "std/io";

fn main() {
    // Exclusive with step
    for i in 0..10:2 {
        io::Println(i);  // Prints: 0, 2, 4, 6, 8
    }

    io::Println("-------");

    // Inclusive with step
    for i in 0..=10:2 {
        io::Println(i);  // Prints: 0, 2, 4, 6, 8, 10
    }
}
```

### Index and Value Pairs

```ferret title="run"
import "std/io";

fn main() {
    let arr := [10, 20, 30];
    for i, val in arr {
        io::Println(i, val);  // Prints: 0 10, 1 20, 2 30
    }
}
```

**Note:** The index variable (first in a `for i, val in ...` loop) is read-only. Loop variables are always mutable otherwise, and you cannot use `const` for loop iterators.

### Reference Iteration

By default, value iteration passes each element by value (copy for copyable types, move for non-copyable types). To modify the original array elements or avoid ownership transfer, use **reference iteration**:

#### Immutable References (`&v`)

Use `&v` to get a read-only reference to each element:

```ferret title="run"
import "std/io";

fn main() {
    let numbers := [100, 200, 300];
    
    for i, &v in numbers {
        // v is &i32 (reference to i32)
        io::Println(i, *v);  // Dereference with * to read
    }
}
```

#### Mutable References (`&mut v`)

Use `&mut v` to get a reference that allows modification:

```ferret title="run"
import "std/io";

fn main() {
    let numbers := [1, 2, 3];
    
    io::Println("Before:", numbers[0], numbers[1], numbers[2]);
    
    for i, &mut v in numbers {
        // v is &mut i32 (mutable reference to i32)
        *v = *v + 10;  // Modify through reference with *
    }
    
    io::Println("After:", numbers[0], numbers[1], numbers[2]);
    // Prints: After: 11 12 13
}
```

**Key points about reference iteration:**
- Use `&v` for read-only access (no ownership transfer, cannot modify)
- Use `&mut v` for read-write access (modifies original array)
- Dereference with `*` to access the value: `*v`
- Only the **second** iterator variable can be a reference
- The index variable is a value (copyable index type)

### Iterating Over Strings

**Important:** Strings are **not directly iterable**. You must convert them to an array first:

```ferret title="run"
import "std/io";

fn main() {
    let text := "Hello";
    
    // ❌ ERROR: Cannot iterate strings directly
    // for i, ch in text { ... }
    
    // ✅ CORRECT: Convert to []char for Unicode characters
    for i, ch in (text as []char) {
        io::Println(i, ch);
    }
    
    // ✅ CORRECT: Convert to []byte for UTF-8 bytes
    for i, b in (text as []byte) {
        io::Println(i, b);
    }
}
```

You can also use references with converted strings:

```ferret title="run"
import "std/io";

fn main() {
    let chars := "ABC" as []char;
    
    io::Println("Before:", chars[0], chars[1], chars[2]);
    
    // Modify each character
    for i, &mut ch in chars {
        // Increment ASCII value: A→B, B→C, C→D
        *ch = ((*ch) as i32 + 1) as char;
    }
    
    io::Println("After:", chars[0], chars[1], chars[2]);
    // Prints: After: B C D
}
```

## While Loops

```ferret title="run"
import "std/io";

fn main() {
    let x := 0;
    while x < 5 {
        io::Println(x);
        x = x + 1;
    }
}
```
This loop continues as long as the condition `x < 5` is true.

There is no do-while loop in Ferret; use a while loop with an initial condition instead.
