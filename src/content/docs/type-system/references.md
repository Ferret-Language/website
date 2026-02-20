---
title: Reference Types
description: Working with reference types in Ferret
sidebar:
  order: 3
---

Reference types in Ferret provide a way to pass data by reference rather than by value. When you use a reference type `&T`, you're working with a reference to a value of type `T` rather than a copy of the value.

## What Are Reference Types?

By default, Ferret passes values by value. For copyable types this copies; for non-copyable owned types this moves ownership. Reference types let you explicitly borrow instead.

```ferret
let x := 1;
let y := x;      // copy (primitive)

let data := [1, 2, 3];
let data2 := data; // move (dynamic array ownership transferred)
```

```ferret
type LargeData struct {
    .Buffer: [1000]i32,
    .Metadata: str,
};

// Without reference - value semantics (copy if copyable, move if non-copyable)
fn process_value(data: LargeData) {
    // Works with an owned value
}

// With reference - borrow only (no ownership transfer)
fn process_ref(data: &LargeData) {
    // Works with the original data via reference
}
```

## Reference Type Syntax

Ferret has two kinds of references:

- **Immutable references** (`&T`): Read-only access to a value
- **Mutable references** (`&mut T`): Read-write access to a value

Use `&` before a type to declare an immutable reference, and `&mut` for a mutable reference:

```ferret
// Function parameter with immutable reference
fn process(data: &LargeData) {
    // Can read from data, but cannot modify
}

// Function parameter with mutable reference
fn modify(data: &mut LargeData) {
    // Can both read and modify data
}

// Variable with reference type
let config_ref: &Config = get_config();
let mut_config: &mut Config = get_mutable_config();
```

When you call a function with a reference parameter, you use the `&` or `&mut` operator to create the reference:

```ferret
let arr: []i32 = [10, 20, 30];

// Immutable reference
let immut_ref := &arr;
process(immut_ref);

// Mutable reference
let mut_ref := &mut arr;
modify(mut_ref);
```

## Explicit Dereferencing

When you need to read the value through a reference, use the dereference operator `*`:

```ferret
import "std/io";

let x := 42;
let r: &i32 = &x;
let value := *r;  // Dereference to get the value (42)
io::Println(*r);  // Print the dereferenced value
```

To modify through a mutable reference, use `*` on the left side of assignment:

```ferret
import "std/io";

let y := 10;
let r_mut: &mut i32 = &mut y;
*r_mut = 20;  // Modify the value through the reference
io::Println(y);  // Prints: 20
```

## Reference Iteration in Loops

References are commonly used in for-loops to avoid ownership transfer of array elements or to modify them in place:

### Immutable Reference Iteration

Use `&v` to iterate with read-only references:

```ferret
import "std/io";

let numbers := [100, 200, 300];

for i, &v in numbers {
    // v is &i32 (reference to i32)
    io::Println(i, *v);  // Dereference to read
}
```

This avoids taking ownership of each element, which is useful for large structures:

```ferret
type LargeStruct struct {
    .Data: [1000]i32,
    .Name: str,
};

let items: []LargeStruct = [...];

for i, &item in items {
    // item is &LargeStruct (no ownership transfer)
    io::Println(item.Name);  // Auto-dereference for fields
}
```

### Mutable Reference Iteration

Use `&mut v` to modify array elements in place:

```ferret
import "std/io";

let numbers := [1, 2, 3];

io::Println("Before:", numbers[0], numbers[1], numbers[2]);

for i, &mut v in numbers {
    // v is &mut i32 (mutable reference)
    *v = *v + 10;  // Modify through reference
}

io::Println("After:", numbers[0], numbers[1], numbers[2]);
// Prints: After: 11 12 13
```

This is essential for modifying large structures without ownership transfer:

```ferret
type Player struct {
    .Health: i32,
    .Score: i32,
};

let players: []Player = [...];

// Update all player scores efficiently
for i, &mut player in players {
    player.Score = player.Score + 10;  // Auto-dereference for fields
    player.Health = 100;                // Modifies original array
}
```

**Important notes about reference iteration:**
- Only the **second** iterator variable (value) can be a reference
- The index variable is always a value (copyable index type)
- Use `&v` for read-only access (no ownership transfer)
- Use `&mut v` for read-write access (modifies original array)
- Dereference with `*` is needed for arithmetic but not for field access

## When to Use References

### Performance Optimization

References avoid ownership transfer of large data structures:

```ferret
type GameState struct {
    .Players: [100]Player,
    .World: WorldMap,
    .Physics: PhysicsEngine,
};

// Efficient - no copy
fn update_game(state: &mut GameState) {
    // Read and modify the game state
}
```

### Shared Access

Multiple parts of your code can reference the same data:

```ferret
type Config struct {
    .DatabaseUrl: str,
    .MaxConnections: i32,
    .Timeout: i32,
};

fn setup_database(config: &Config) {
    // Use config.DatabaseUrl
}

fn setup_cache(config: &Config) {
    // Use config.MaxConnections
}

let config := { 
    .DatabaseUrl = "localhost:5432",
    .MaxConnections = 100,
    .Timeout = 5000
} as Config;

// Borrow explicitly when the parameter expects a reference
setup_database(&config);
setup_cache(&config);
```

## Heap Ownership Type (`#T`)

Ferret uses `#T` to represent owned heap values.

```ferret
let a: #i32 = #10;
let b: #i32 = a;  // move heap ownership
// let c := a;    // ❌ a was moved

let value: i32 = b; // reading #T in value context yields T
```

Key rules:
- Heap allocation is explicit with `#expr`.
- A target typed as `#T` must receive heap ownership (`#expr` or another `#T` owner).
- Assigning/passing `#T` moves ownership.
- Nested heap wrappers like `##T` are not supported.

## Resource Handles And References

Compiler resource handles (such as file and TCP handles) are non-copyable.

```ferret
import "std/fs";

let f := fs::CreateRW("log.txt") catch err {
    return;
};

let f2 := f;  // ownership moved to f2
// f.Close(); // ❌ use of moved value
f2.Close();
```

Use references when you want temporary access without ownership transfer:
- `&T` for read-only access
- `&mut T` for mutable access
- `T` value parameters/receivers when consuming ownership is intended
## References vs Values

Understanding when to use each:

| Aspect | Value (`T`) | Immutable Ref (`&T`) | Mutable Ref (`&mut T`) |
|--------|-------------|---------------------|---------------------|
| **Copy/Move** | Copy for copyable types, move for non-copyable types | Passes a pointer | Passes a pointer |
| **Size overhead** | Full size of T | Always 8 bytes | Always 8 bytes |
| **Mutation** | Can't affect original | Can't modify | Can modify |
| **Safety** | Always safe | Always safe | Must ensure validity |
| **Borrowing** | N/A | Multiple allowed | Exclusive (no other borrows) |
| **Default** | ✅ Ferret default | Opt-in with `&` | Opt-in with `&mut` |

## Automatic Dereferencing for Field Access

When you have a reference type parameter or variable, Ferret **automatically dereferences** it for field access and method calls. You don't need the `*` operator for these operations:

```ferret
type Point struct {
    .X: i32,
    .Y: i32,
};

fn (p: Point) distance() -> f64 {
    return math::sqrt(p.X * p.X + p.Y * p.Y);
}

fn process_point(p_ref: &Point) {
    // Automatic dereferencing for field access and methods
    let x := p_ref.X;              // Access field directly
    let dist := p_ref.distance();  // Call method directly
    
    // No need for (*p_ref).X or (*p_ref).distance()
}

fn modify_point(p_ref: &mut Point) {
    // Automatic dereferencing also works for mutable references
    p_ref.X = 10;  // Modifies the field through the reference
}
```

Assignments to a reference variable or index access through a reference still require explicit dereferencing:

```ferret
let r: &mut i32 = &mut x;
*r = 10;      // ✅ OK - explicit deref for assignment

let arr_ref: &mut [2]i32 = &mut arr;
(*arr_ref)[0] = 99;  // ✅ OK - explicit deref for indexing
```

When you need the actual value (not a field or method), you must explicitly dereference:

```ferret
import "std/io";

let x := 42;
let r: &i32 = &x;

// ❌ Error: Can't pass reference where value is expected
io::Println(r);

// ✅ OK: Explicitly dereference to get the value
io::Println(*r);
```

## References with Methods

Methods can take `self` by reference:

```ferret
type Counter struct {
    .Value: i32,
};

fn (c: &mut Counter) increment() {
    c.Value++;  // Auto-dereference for field access
}

fn (c: &Counter) get_value() -> i32 {
    return c.Value;  // Auto-dereference for field access
}

let counter := { .Value = 0 } as Counter;
counter.increment();           // Method automatically borrows as &mut
let value := counter.get_value();  // Method automatically borrows as &
```

## References and Optional Types

References can be optional, allowing functions to return a reference or `none`:

```ferret
import "std/io";

type User struct {
    .Name: str,
    .Age: i32,
};

fn find_user(id: i32) -> ?&User {
    // Returns optional reference to User
    if user_exists(id) {
        return ref_to_user();  // Returns &User (automatically wrapped in optional)
    }
    return none;
}

let user_ref := find_user(42);
if user_ref != none {
    io::Println(user_ref.Name);  // Automatic dereferencing
}
```

## Common Patterns

### Builder Pattern with References

```ferret
type RequestBuilder struct {
    .Url: str,
    .Method: str,
    .Headers: map[str]str,
};

fn (b: &mut RequestBuilder) set_url(url: str) -> &mut RequestBuilder {
    b.Url = url;
    return b;
}

fn (b: &mut RequestBuilder) set_method(method: str) -> &mut RequestBuilder {
    b.Method = method;
    return b;
}

fn (b: &RequestBuilder) build() -> Request {
    return { .Url = b.Url, .Method = b.Method } as Request;
}

let builder := { .Url = "", .Method = "GET", .Headers = {} } as RequestBuilder;
let request := builder
    .set_url("https://api.example.com")
    .set_method("POST")
    .build();
```

## Best Practices

### Default to Values

Start with value types and only use references when needed:

```ferret
// Good - simple and safe
fn calculate(x: i32, y: i32) -> i32 {
    return x + y;
}

// Overkill - no benefit for small types
fn calculate(x: &i32, y: &i32) -> i32 {
    return x + y;  // Automatic dereferencing
}
```

### Use References for Large Types

Consider references when passing large structs:

```ferret
type HugeStruct struct {
    .Data1: [10000]i32,
    .Data2: [10000]f64,
    // ... many more fields
};

// Good - avoids copying 160KB+
fn process(data: &HugeStruct) {
    // Read-only access
}

// Good - avoids copying and allows modification
fn modify(data: &mut HugeStruct) {
    // Can modify the data
}

// Bad - copies 160KB+ on every call
fn process(data: HugeStruct) {
    // ...
}
```

### Don't Over-Reference

Not everything needs to be a reference:

```ferret
// Bad - unnecessary references for primitives
fn add(a: &i32, b: &i32) -> i32 {
    return a + b;
}

// Good - primitives are cheap to copy
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}
```

## Borrow Semantics

Ferret enforces strict borrowing rules to ensure memory safety:

### Rules

1. **Multiple immutable references are allowed:**
   ```ferret
   let arr: []i32 = [10, 20, 30];
   let ref1 := &arr;
   let ref2 := &arr;  // ✅ OK - multiple immutable refs allowed
   ```

2. **Only one mutable reference at a time:**
   ```ferret
   let arr: []i32 = [10, 20, 30];
   let mut_ref1 := &mut arr;
   let mut_ref2 := &mut arr;  // ❌ Error - can't have multiple mutable refs
   ```

3. **Cannot have mutable and immutable references simultaneously:**
   ```ferret
   let arr: []i32 = [10, 20, 30];
   let immut_ref := &arr;
   let mut_ref := &mut arr;  // ❌ Error - conflicts with immutable ref
   ```

4. **Cannot use value while mutably borrowed:**
   ```ferret
   import "std/io";

   let arr: []i32 = [10, 20, 30];
   let mut_ref := &mut arr;
   io::Println(arr[0]);  // ❌ Error - can't use arr while mutably borrowed
   ```

5. **Borrows are released after function calls:**
   ```ferret
   let arr: []i32 = [10, 20, 30];
   append(&mut arr, 100);  // Borrow released after call
   append(&mut arr, 200);  // ✅ OK - can borrow again
   ```

These rules prevent data races and ensure memory safety at compile time!

## Comparison with Other Languages

Ferret's reference types are similar to:

- **Rust**: Similar `&T` and `&mut T` syntax with borrowing rules
- **C++**: Like C++ references (`T&`) but with safety checks
- **C#**: Similar to `ref` keyword but more explicit
- **Go**: More explicit than Go's automatic pointer handling

Unlike pointers in C/C++:
- ✅ No null references (use `?&T` for optional references)
- ✅ No dangling references (checked at compile time)
- ✅ No pointer arithmetic
- ✅ Automatic lifetime checking
- ✅ Borrow checker prevents data races

## Borrow Semantics with Built-in Functions

Ferret's built-in functions for containers respect borrow semantics:

- **Read operations** use immutable references (`&T`): `len(&value)`, `cap(&value)`
- **Write operations** require mutable references (`&mut T`): `append()`

```ferret
let arr: []i32 = [10, 20, 30];
let scores := {"alice" => 95} as map[str]i32;

// ✅ OK - read operations use immutable references
let length := len(&arr);
let arr_ref := &arr;
let length2 := len(arr_ref);

// ✅ OK - write operations with mutable reference
append(&mut arr, 40);

// ❌ Error - can't use immutable reference for mutation
let arr_ref := &arr;
append(arr_ref, 40);  // Compile error: requires mutable reference
```

The compiler enforces these rules:
- You cannot have multiple mutable references to the same value
- You cannot have mutable and immutable references simultaneously
- You cannot use a value while it's mutably borrowed

**Learn more:** See the [Built-in Functions](/advanced/builtins) documentation for complete details.

## Next Steps

- [Learn about Borrow Checker](/type-system/borrow-checker) - Deep dive into borrowing rules and safety
- [Learn about Methods](/type-system/methods) - Methods can use reference receivers
- [Explore Structs](/type-system/structs) - Common place to use references
- [Understand Optional Types](/type-system/optionals) - Combine with references for `?&T`
- [Built-in Functions](/advanced/builtins) - Container operations with borrow semantics
