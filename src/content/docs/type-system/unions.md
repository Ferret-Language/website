---
title: Union Types
description: Working with union types in Ferret
sidebar:
  order: 9
---

Union types let a value be **one of several types**. They are useful when you want flexible inputs or results without defining a full enum.

## Defining a Union

```ferret
type Result union { i32, str };
```

You can also use an anonymous union type directly in a variable declaration or function signature:

```ferret
let value: union { i32, str } = 42;
```

## Assigning Values

A value can be implicitly assigned to a union if it matches one of the variants:

```ferret
type Result union { i32, str };

let ok: i32 = 42;
let a: Result = ok;  // ✅ i32 is a variant

let err: str = "failed";
let b: Result = err; // ✅ str is a variant
```

## Using Union Values

To use a union value as a specific type, narrow it with the `is` operator:

```ferret
type Result union { i32, str };

fn print_result(r: Result) {
    if r is i32 {
        let n: i32 = r;  // r narrowed to i32
        io::Println(n);
    } else {
        let s: str = r;  // r narrowed to str
        io::Println(s);
    }
}
```

Outside of a narrowed branch, the compiler treats the value as the full union type.

## When to Use Unions

- Accept multiple input types for a function
- Return either a value or an error message
- Model data that can legitimately be different shapes

If you need tagged variants with distinct names, prefer enums.

## Related

- [Type Compatibility and Casting](/type-system/compatibility)
- [Enums](/type-system/enums)
