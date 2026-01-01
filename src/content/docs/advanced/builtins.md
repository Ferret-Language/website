---
title: Built-in Functions
description: Learn about Ferret's built-in functions for working with containers and common operations
sidebar:
  order: 1
---

# Built-in Functions

Ferret provides several built-in functions that are available in every module without needing to import them. These functions help you work with arrays, maps, and perform common operations.

## Container Operations

Ferret provides a unified set of built-in functions that work with both arrays and maps. These functions respect Ferret's borrow semantics: read operations use immutable references (`&T`), while write operations require mutable references (`&'T`).

### `len(value) -> i32`

Returns the length of a string, array, or map.

```ferret
let s: str = "Hello";
let arr: []i32 = [1, 2, 3];
let scores := {"alice" => 95, "bob" => 87} as map[str]i32;

let str_len := len(s);      // 5
let arr_len := len(arr);     // 3
let map_size := len(scores); // 2
```

### `get(&container, key) -> T?`

Safely retrieves a value from an array or map, returning an optional type. Returns `none` if the key/index doesn't exist.

```ferret
let arr: []i32 = [10, 20, 30];
let scores := {"alice" => 95, "bob" => 87} as map[str]i32;

// Array access
let val1 := get(&arr, 0);   // Returns i32? with value 10
let val2 := get(&arr, 10);  // Returns i32? with value none (out of bounds)

// Map access
let score1 := get(&scores, "alice");  // Returns i32? with value 95
let score2 := get(&scores, "charlie"); // Returns i32? with value none (key doesn't exist)
```
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
grep

**Note:** `get()` uses an immutable reference (`&T`) since it only reads from the container.

### `get_or(&container, key, fallback) -> T`

Retrieves a value from an array or map, returning the fallback value if the key/index doesn't exist.

```ferret
let arr: []i32 = [10, 20, 30];
let scores := {"alice" => 95} as map[str]i32;

// Array access with fallback
let val1 := get_or(&arr, 1, 999);  // 20
let val2 := get_or(&arr, 10, 999); // 999 (fallback)

// Map access with fallback
let score1 := get_or(&scores, "alice", 0);    // 95
let score2 := get_or(&scores, "bob", 0);      // 0 (fallback)
```

This is a convenient alternative to using the coalescing operator with `get()`.

### `has(&container, key) -> bool`

Checks if a key or index exists in an array or map.

```ferret
let arr: []i32 = [10, 20, 30];
let scores := {"alice" => 95, "bob" => 87} as map[str]i32;

// Array bounds checking
let has_index := has(&arr, 0);   // true
let out_of_bounds := has(&arr, 10); // false

// Map key checking
let has_alice := has(&scores, "alice");  // true
let has_charlie := has(&scores, "charlie"); // false
```

### `set(&'container, key, value) -> bool`

Sets a value in an array or map. Returns `true` on success, `false` if the operation fails (e.g., out of bounds for arrays).

```ferret
let arr: []i32 = [10, 20, 30];
let scores := {"alice" => 95} as map[str]i32;

// Array modification (requires mutable reference)
set(&'arr, 0, 100);
io::Println(arr[0]);  // 100

// Map modification (requires mutable reference)
set(&'scores, "bob", 87);      // Adds new key
set(&'scores, "alice", 96);    // Updates existing key
```

**Important:** `set()` requires a mutable reference (`&'T`) because it modifies the container.

### `remove(&'container, key) -> bool`

Removes a key from a map. Returns `true` if the key was found and removed, `false` otherwise.

```ferret
let scores := {"alice" => 95, "bob" => 87} as map[str]i32;

// Remove a key (requires mutable reference)
let removed := remove(&'scores, "bob");  // true
let not_found := remove(&'scores, "charlie"); // false

// Check if key still exists
let has_bob := has(&scores, "bob");  // false
```

**Note:** `remove()` only works with maps, not arrays. Arrays don't support removing elements (use slices or create a new array).

## Array-Only Operations

These functions work specifically with dynamic arrays.

### `append(&'array, value) -> bool`

Appends an element to the end of a dynamic array. Returns `true` on success.

```ferret
let arr: []i32 = [10, 20, 30];

// Append a value (requires mutable reference)
append(&'arr, 40);
io::Println(len(arr));  // 4
io::Println(arr[3]);    // 40
```

**Note:** `append()` only works with dynamic arrays (`[]T`), not fixed-size arrays (`[N]T`).

### `insert(&'array, index, value) -> bool`

Inserts an element at a specific index in a dynamic array, shifting existing elements. Returns `true` on success, `false` if the index is invalid.

```ferret
let arr: []i32 = [10, 20, 30];

// Insert at index 1 (requires mutable reference)
insert(&'arr, 1, 15);
// arr is now [10, 15, 20, 30]

io::Println(arr[1]);    // 15
io::Println(arr[2]);    // 20 (shifted)
io::Println(len(arr));  // 4
```

**Note:** `insert()` only works with dynamic arrays. The index must be between 0 and `len(array)` (inclusive).

## Direct Container Access

### Array Indexing

Direct array indexing `arr[index]` returns the value type `T` directly. For fixed-size arrays with constant indices, Ferret performs compile-time bounds checking:

```ferret
let arr: [5]i32 = [1, 2, 3, 4, 5];

let x := arr[2];   // ✅ OK - returns i32
let y := arr[10];  // ❌ Compile error: constant index 10 is out of bounds!

// Runtime indices panic if out of bounds
let i := 10;
let z := arr[i];   // ❌ Runtime panic: index out of bounds!
```

**For safe access without panics, use `get()`, `get_or()`, or `has()` instead.**

### Map Indexing

Direct map indexing `map[key]` returns the value type `T` directly (not `T?`). If the key doesn't exist, the program will panic:

```ferret
let scores := {"alice" => 95, "bob" => 87} as map[str]i32;

let alice_score := scores["alice"];  // ✅ 95 (returns i32)
let bob_score := scores["bob"];      // ✅ 87 (returns i32)
let charlie_score := scores["charlie"]; // ❌ Panic: key not found!
```

**Important:** Use `get()` or `get_or()` if you're unsure whether a key exists. Direct indexing should only be used when you're certain the key exists.

## Borrow Semantics

All built-in functions respect Ferret's borrow semantics:

- **Read operations** (`get`, `get_or`, `has`) use immutable references (`&T`)
- **Write operations** (`set`, `remove`, `append_arr`, `insert`) require mutable references (`&'T`)

```ferret
let arr: []i32 = [10, 20, 30];

// ✅ OK - read operations with immutable reference
let val := get(&arr, 0);
let exists := has(&arr, 1);

// ✅ OK - write operations with mutable reference
set(&'arr, 0, 100);
append(&'arr, 40);

// ❌ Error - can't use immutable reference for mutation
set(&arr, 0, 100);  // Compile error: requires mutable reference
```

## Best Practices

### Use `get()` for Safe Access

When you're not sure if a key/index exists, use `get()`:

```ferret
let scores := {"alice" => 95} as map[str]i32;

// ✅ Safe - handles missing keys
let score := get(&scores, "bob");
if score != none {
    process(score);
}
```

### Use `get_or()` for Defaults

When you have a sensible default value, use `get_or()`:

```ferret
let scores := {"alice" => 95} as map[str]i32;

// ✅ Convenient - provides default in one line
let score := get_or(&scores, "bob", 0);
```

### Use Direct Indexing When Certain

Only use direct indexing when you're certain the key/index exists:

```ferret
let arr: []i32 = [10, 20, 30];

// ✅ Safe - we know index 0 exists
let first := arr[0];

// ❌ Dangerous - might panic
let unknown := arr[100];
```

### Check Before Mutating

Use `has()` to check before performing operations:

```ferret
let scores := {"alice" => 95} as map[str]i32;

if has(&scores, "bob") {
    set(&'scores, "bob", 87);
} else {
    // Handle missing key
}
```

## Summary

Ferret's built-in functions provide a safe and consistent way to work with containers:

- **`len()`** - Get the length/size of strings, arrays, and maps
- **`get(&c, k) -> T?`** - Safe access returning optional
- **`get_or(&c, k, fallback) -> T`** - Access with default value
- **`has(&c, k) -> bool`** - Check if key/index exists
- **`set(&'c, k, v) -> bool`** - Set value (requires mutable reference)
- **`remove(&'c, k) -> bool`** - Remove key from map (requires mutable reference)
- **`append(&'a, v) -> bool`** - Append to array (requires mutable reference)
- **`insert(&'a, i, v) -> bool`** - Insert into array (requires mutable reference)

All functions respect Ferret's borrow semantics, ensuring memory safety and preventing data races.

