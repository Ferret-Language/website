---
title: Type Compatibility and Casting
description: Understanding when types can be assigned and when casting is required in Ferret
sidebar:
  order: 1
---

Ferret has a strict type system that ensures type safety while allowing convenient implicit conversions where safe. This page explains the rules for type compatibility and when explicit casting is required.

## Type Compatibility Levels

Ferret classifies type assignments into three categories:

- **Identical**: Types are exactly the same and can be assigned without any conversion
- **Implicitly Castable**: Types can be safely converted without losing information
- **Explicitly Castable**: Conversion is possible but requires explicit casting due to potential information loss

## Casting Syntax

When explicit casting is required, Ferret uses the `as` keyword:

```ferret
let source_value: SourceType = get_value();
let target_value: TargetType = source_value as TargetType;
```

## Primitive Type Conversions

### Integer Types

Ferret supports implicit widening conversions between integer types (no information loss):

```ferret
let a: i8 = 10;
let b: i16 = a;  // Implicit: i8 -> i16 (widening)
let c: i32 = b;  // Implicit: i16 -> i32 (widening)
```

Reverse conversions (narrowing) can lose data, so they require explicit casting:

```ferret
let x: i32 = 1000;
let y: i16 = x as i16;  // Explicit cast: potential data loss acknowledged
```

### Floating Point Types

Similar rules apply to floating point types:

```ferret
let f32_val: f32 = 1.5;
let f64_val: f64 = f32_val;  // Implicit: f32 -> f64
let f128_val: f128 = f64_val;  // Implicit: f64 -> f128
```

### Cross-Type Conversions

Conversions between integers and floats can lose precision or change representation, so they require explicit casting to make the intent clear:

```ferret
let int_val: i32 = 42;
let float_val: f64 = int_val as f64;  // Explicit cast: integer to float

let float_val: f64 = 3.14;
let int_val: i32 = float_val as i32;  // Explicit cast: float to integer (truncates decimal part)
```

## Named Types

Named types provide type safety by distinguishing semantically different types, even when they have the same underlying representation.

### Base to Named

Base types can be implicitly assigned to compatible named types:

```ferret
type Integer i32;
type Float f64;

let base_int: i32 = 42;
let named_int: Integer = base_int;  // Implicit: base -> named

let base_float: f64 = 3.14;
let named_float: Float = base_float;  // Implicit: base -> named
```

### Named to Base

Converting from named types back to base types loses the type distinction, so explicit casting is required:

```ferret
type Integer i32;

let named_val: Integer = 42;
let base_val: i32 = named_val as i32;  // Explicit cast: loses type information
```

### Named to Named

Even if two named types have the same underlying type, they represent different semantic concepts and require explicit casting to prevent accidental mixing:

```ferret
type Count i32;
type Index i32;

let count: Count = 10;
let index: Index = count as Index;  // Explicit cast: different semantic types
```

## Union Types

### Assigning to Unions

Values can be implicitly assigned to union types if they match one of the variants:

```ferret
type Result union { i32, str };

let success: i32 = 42;
let result: Result = success;  // Implicit: i32 is a variant

let error: str = "failed";
let result2: Result = error;  // Implicit: str is a variant
```

### Named Unions

Named union types work the same way:

```ferret
type MyUnion union { i32, str };

let val: i32 = 100;
let union_val: MyUnion = val;  // Implicit
```

## Type Narrowing with `is`

The `is` operator allows checking and narrowing union types:

```ferret
type Result union { i32, str };

fn process(result: Result) {
    if result is i32 {
        // Inside this block, result is narrowed to i32
        let value: i32 = result;  // Valid
        io::Println("Success: {}", value);
    } else {
        // result is narrowed to str
        let message: str = result;  // Valid
        io::Println("Error: {}", message);
    }
}
```



## Special Cases

### Untyped Literals

Untyped integer and float literals can be implicitly assigned to compatible types:

```ferret
let int_var: i32 = 42;     // Implicit: untyped int -> i32
let float_var: f64 = 3.14; // Implicit: untyped float -> f64

// But not to incompatible types:
let wrong: f64 = 42;  // Error: untyped int cannot be assigned to f64
```

### Optional Types

The `none` value can be implicitly assigned to any optional type:

```ferret
let optional_int: i32? = none;  // Implicit
let optional_str: str? = none;  // Implicit
```

### References

Reference types have specific compatibility rules:

```ferret
let x: i32 = 42;
let ref_x: &i32 = &x;

let y: &mut i32 = &mut x;  // Mutable reference
let z: &i32 = y;           // Implicit: &mut -> & (variance)
```

## Common Pitfalls

1. **Assuming named types are interchangeable**: Even with the same underlying type, different named types require casting.

2. **Forgetting explicit casts for narrowing**: Converting from wider to narrower types always requires explicit casting.

3. **Untyped literals in mixed contexts**: Untyped literals cannot be assigned to incompatible types.

4. **Union narrowing**: After type narrowing with `is`, the compiler knows the narrowed type, but you must use it correctly.

## Best Practices

- Use named types to create domain-specific types for better code clarity and safety
- Be explicit about casts when converting between different numeric representations
- Leverage type narrowing with unions to write safer, more expressive code
- Use the compiler's error messages to guide when explicit casts are needed

Remember: Ferret prioritizes safety - if a conversion could lose information or violate type safety, it requires explicit casting.