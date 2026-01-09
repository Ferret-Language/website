---
title: Borrow Checker
description: Understanding Ferret's borrow checker and memory safety guarantees
sidebar:
  order: 4
---

Ferret's borrow checker is a compile-time analysis system that ensures memory safety without garbage collection. It enforces strict rules about how references can be used, preventing common bugs like data races, use-after-free, and iterator invalidation.

## Core Concepts

### Ownership and Copies

Every binding owns its value. Ferret copies by default, so assigning or returning a value creates a copy unless you explicitly move it. Literals bind directly into the destination without an extra copy.

```ferret
fn main() {
    let x := 42;
    let y := x;   // copy
    let z := @x;  // move; x is no longer usable
}
```

### Moves (@)

Use `@` to move a value out of a binding. Moves are only allowed on identifiers (phase 1), cannot move references, and cannot happen while the value is borrowed.

```ferret
let a := 10;
let b := @a;  // a moved
// let c := a;  // ❌ Error: use of moved value
```

### Borrowing

Instead of copying or moving, you can **borrow** a value by taking a reference to it:

```ferret
let arr := [1, 2, 3, 4, 5];
let arr_ref := &arr;  // Borrow arr immutably
```

Borrowing allows multiple parts of your code to access the same data without copying.

## The Borrow Rules

Ferret enforces three fundamental rules at compile time:

### Rule 1: Multiple Immutable Borrows

You can have as many immutable references (`&T`) as you want:

```ferret
let data := [10, 20, 30];

let ref1 := &data;
let ref2 := &data;
let ref3 := &data;

// ✅ All valid - multiple readers allowed
io::Println(*ref1);
io::Println(*ref2);
io::Println(*ref3);
```

**Why?** Reading data is always safe - multiple readers cannot interfere with each other.

### Rule 2: Only One Mutable Borrow

You can have only ONE mutable reference (`&mut T`) at a time:

```ferret
let arr := [1, 2, 3];

let mut_ref1 := &mut arr;
let mut_ref2 := &mut arr;  // ❌ ERROR: cannot borrow arr as mutable more than once

*mut_ref1 = 10;  // Would cause issues if mut_ref2 existed
```

**Why?** Multiple writers could cause data races - only one writer ensures safety.

### Rule 3: No Mixed Borrows

You cannot have mutable and immutable borrows at the same time:

```ferret
let data := [1, 2, 3];

let immut_ref := &data;
let mut_ref := &mut data;  // ❌ ERROR: cannot borrow data as mutable while immutably borrowed

io::Println(*immut_ref);  // Reader would see unexpected changes
*mut_ref = 99;            // Writer would invalidate reader
```

**Why?** Readers expect data to stay unchanged, but writers modify it - mixing them breaks that expectation.

## Borrow Scope

Borrows have a scope - they're only active while they're being used:

```ferret
let arr := [10, 20, 30];

{
    let ref1 := &arr;
    io::Println(*ref1);  // ref1 used here
}  // ref1 goes out of scope - borrow ends

// ✅ Can borrow again after previous borrow ended
let ref2 := &arr;
```

### Early Release

Borrows are released when they're no longer needed:

```ferret
let arr := [1, 2, 3];

let immut_ref := &arr;
io::Println(*immut_ref);  // Last use of immut_ref
// Borrow ends after last use

// ✅ Can now take mutable borrow
let mut_ref := &mut arr;
*mut_ref = 10;
```

## Common Patterns

### Passing References to Functions

Function calls automatically release borrows after the call:

```ferret
fn process_data(data: &[]i32) {
    // Use data...
}

let arr := [1, 2, 3];

process_data(&arr);  // Borrow during call
process_data(&arr);  // ✅ Can borrow again - previous borrow released
```

### Method Receivers

Methods automatically borrow `self` with the appropriate type:

```ferret
type Counter struct {
    .value: i32,
};

fn (c: &mut Counter) increment() {
    c.value++;  // Auto-borrows as &mut
}

fn (c: &Counter) get() -> i32 {
    return c.value;  // Auto-borrows as &
}

let counter := { .value: 0 } as Counter;

counter.increment();  // Borrows as &mut
counter.increment();  // ✅ Previous borrow released
let val := counter.get();  // Borrows as &
```

### Container Mutations

Built-in functions follow borrow rules:

```ferret
let arr := [1, 2, 3];

// ✅ Multiple immutable uses
let len1 := len(&arr);
let len2 := len(&arr);

// ✅ Mutable operations
append(&mut arr, 4);
append(&mut arr, 5);

// ❌ ERROR: Can't mix mutable and immutable
let len := len(&arr);
append(&mut arr, 6);  // ERROR if len borrow still active
```

## Disjoint Borrows

Ferret allows borrowing **different fields** of a struct simultaneously:

```ferret
type Point struct {
    .x: i32,
    .y: i32,
};

let p := { .x: 10, .y: 20 } as Point;

let x_ref := &p.x;
let y_mut := &mut p.y;  // ✅ OK - different fields

io::Println(*x_ref);  // Read x
*y_mut = 30;          // Modify y
```

**Why it works:** `x` and `y` are distinct memory locations - modifying one doesn't affect the other.

**Conservative array indexing:** For arrays, the borrow checker is conservative:

```ferret
let arr := [1, 2, 3];

let elem0 := &arr[0];
let elem1 := &mut arr[1];  // ❌ ERROR: assumes all indices might overlap

// Borrow checker can't prove arr[0] and arr[1] don't overlap
```

This is **safe but conservative** - it prevents bugs even if your indices don't actually overlap.

## Lifetime Basics

Every reference has a **lifetime** - the scope where it's valid:

```ferret
let r: &i32;  // Declared but not initialized

{
    let x := 42;
    r = &x;  // ❌ ERROR: x doesn't live long enough
}  // x destroyed here, but r would still reference it

// r would be a dangling reference here
```

**The rule:** A reference cannot outlive the value it points to.

### Function Lifetimes

When returning references, the borrow checker ensures safety:

```ferret
fn get_first(arr: &[]i32) -> &i32 {
    return &arr[0];  // ✅ OK - returned reference lives as long as input
}

let data := [10, 20, 30];
let first := get_first(&data);  // first borrows from data
io::Println(*first);
```

## Borrow Checker Error Messages

The compiler provides detailed error messages:

```ferret
let arr := [1, 2, 3];
let r1 := &arr;
let r2 := &mut arr;  // ERROR
```

```
error[B0002]: cannot borrow 'arr' as mutable because it is also borrowed as immutable
 --> example.fer:3:11
  |
2 | let r1 := &arr;
  |           ---- immutable borrow occurs here
3 | let r2 := &mut arr;
  |           ~~~~~~~~ mutable borrow occurs here
4 | io::Println(*r1);
  |             --- immutable borrow later used here
```

## Using &mut in Read Contexts

You can pass a mutable reference to read-only operations without creating a second borrow:

```ferret
fn process(data: &mut []i32) {
    // data is &mut []i32
    let len := len(data);  // Read through &mut
    append(data, 100);     // Continue using the same &mut
}
```

The borrow checker treats this as a read through the same mutable reference.

## Design Rationale

### Why Borrow Checking?

**Without borrow checking:**
```rust
// C/C++ style - can cause crashes
let arr := [1, 2, 3];
let ptr1 := &arr[0];
arr.clear();       // Destroys array
println(*ptr1);    // ⚠️ Use-after-free bug!
```

**With borrow checking:**
```ferret
let arr := [1, 2, 3];
let ref := &arr[0];
arr = [];          // ❌ ERROR: cannot modify arr while borrowed
io::Println(*ref);  // Safe - compiler prevents the bug
```

### Performance Benefits

- **Zero runtime cost:** All checks happen at compile time
- **No garbage collector:** Deterministic cleanup
- **No reference counting:** Direct memory access
- **Cache friendly:** Predictable memory layout

### Comparison with Other Languages

| Language | Memory Safety | Runtime Cost | Learning Curve |
|----------|---------------|--------------|----------------|
| **C/C++** | Manual (unsafe) | Zero | High (manual) |
| **Java/C#** | Garbage Collector | Medium-High | Low |
| **Rust** | Borrow Checker | Zero | High |
| **Go** | Garbage Collector | Low-Medium | Low |
| **Ferret** | Borrow Checker | Zero | Medium |

Ferret aims for Rust's safety with a gentler learning curve.

## Common Mistakes

### Mistake 1: Holding Borrows Too Long

```ferret
let arr := [1, 2, 3];

let ref := &arr;
// ... lots of code ...
append(&mut arr, 4);  // ❌ ERROR: still borrowed by ref
```

**Solution:** Limit borrow scope:

```ferret
let arr := [1, 2, 3];

{
    let ref := &arr;
    // Use ref here
}  // Borrow ends

append(&mut arr, 4);  // ✅ OK
```

### Mistake 2: Returning Local References

```ferret
fn create_ref() -> &i32 {
    let x := 42;
    return &x;  // ❌ ERROR: x doesn't live long enough
}
```

**Solution:** Return the value, not a reference:

Use `return @x;` when you want to move a value instead of copying it.

```ferret
fn create_value() -> i32 {
    let x := 42;
    return x;  // ✅ OK - returns a copy
}
```

### Mistake 3: Modifying While Iterating

```ferret
let arr := [1, 2, 3];

for elem in &arr {  // Borrows arr immutably
    append(&mut arr, 10);  // ❌ ERROR: can't mutably borrow while iterating
}
```

**Solution:** Collect changes, then apply:

```ferret
let arr := [1, 2, 3];
let to_add := [];

for elem in &arr {
    append(&mut to_add, 10);
}

for item in &to_add {
    append(&mut arr, *item);  // ✅ OK
}
```

## Best Practices

### 1. Prefer Short-Lived Borrows

```ferret
// ❌ Bad - borrow lives too long
let ref := &data;
// ... 100 lines of code ...
process(ref);

// ✅ Good - borrow only when needed
process(&data);
```

### 2. Use Scopes to Control Lifetimes

```ferret
let arr := [1, 2, 3];

{
    let temp_ref := &arr;
    // Work with temp_ref
}  // Borrow ends here

// Now arr is available for mutable access
```

### 3. Pass by Reference for Large Types

```ferret
type HugeData struct {
    .buffer: [10000]i32,
    // ... more fields
};

// ✅ Good - avoids copy
fn process(data: &HugeData) {
    // ...
}

// ❌ Bad - expensive copy
fn process(data: HugeData) {
    // ...
}
```

### 4. Use Immutable Borrows by Default

Start with `&T` and only use `&mut T` when you need to modify:

```ferret
// ✅ Good - immutable by default
fn calculate(data: &[]i32) -> i32 {
    // Read-only access
}

// Only use &mut when necessary
fn sort(data: &mut []i32) {
    // Modifies the array
}
```

## Next Steps

- [Reference Types](/type-system/references) - Learn reference syntax and usage
- [Methods](/type-system/methods) - Use references in method receivers
- [Error Handling](/advanced/errors) - Borrow checking with Result types
- [Practical Examples](/advanced/practical) - Real-world borrow patterns
