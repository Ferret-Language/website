---
title: "Data Types"
description: "Learn about Ferret's built-in data types"
sidebar:
  order: 2
---

Now that you know how to create variables and constants, it's time to learn what kinds of values they can store. These are called **data types**.

Ferret comes with a set of built‑in types that let you work with numbers, text, true/false values, and more.

## Primitive Types

Primitive types are the simplest kinds of data. Internally they are just numbers. Unlike other languages, Ferret has a rich set of primitive types to give you more control over how data is stored and manipulated. We support maximum 256-bit integers and floating-point numbers with up to 71 decimal digits of precision! And it's built right into the language without needing any special libraries.

### Integer Types

These types store whole numbers.

| Type  | Size   | Range         | Description                 |
| ----- | ------ | ------------- | --------------------------- |
| `i8`  | 8‑bit  | -2⁷ to 2⁷‑1   | Small integer               |
| `i16` | 16‑bit | -2¹⁵ to 2¹⁵‑1 | Medium integer              |
| `i32` | 32‑bit | -2³¹ to 2³¹‑1 | Standard integer            |
| `i64` | 64‑bit | -2⁶³ to 2⁶³‑1 | Bigger integer              |
| `i128` | 128‑bit | -2¹²⁷ to 2¹²⁷‑1 | Very big integer            |
| `i256` | 256‑bit | -2²⁵⁵ to 2²⁵⁵‑1 | Extremely big integer       |
| `u8`  | 8‑bit  | 0 to 2⁸‑1     | Non‑negative small integer  |
| `u16` | 16‑bit | 0 to 2¹⁶‑1   | Non‑negative medium integer |
| `u32` | 32‑bit | 0 to 2³²‑1    | Non‑negative integer        |
| `u64` | 64‑bit | 0 to 2⁶⁴‑1    | Bigger non‑negative integer |
| `u128` | 128‑bit | 0 to 2¹²⁸‑1   | Very big non‑negative integer |
| `u256` | 256‑bit | 0 to 2²⁵⁶‑1   | Extremely big non‑negative integer |

Now if you are confused about the `i` and `u` prefixes, `i` stands for signed integers (can be negative) and `u` stands for unsigned integers (non-negative only). And the numbers `32` and `64` stand for the number of bits used to store the value. Other languages may use different names for these types, but the concepts are the same. So when you see `i32`, think of it as a 32-bit signed integer.

Now remember the `:=` operator you learned about in the Variables & Constants section? It is used for declaring variables and constants with type inference. Type inference means Ferret can automatically figure out the type based on the value you provide. But if you want to explicitly specify the type, you can do so using a colon `:` followed by the type name.

```ferret
let count: i32 = 42;
let small: i8 = -128;
let big_number: i64 = 9223372036854775807;
let positive: u32 = 4294967295;
let very_big: u128 = 340282366920938463463374607431768211455;
let huge: u256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
```

#### Integer Literal Defaults

Integer literals are untyped until a concrete integer type is required. With a typed context (annotation, parameter, struct field, and so on), the literal is checked to fit and treated as that type. Without a typed context, Ferret uses the default integer type (currently `i32`). If the literal does not fit, it is a compile-time error and you must annotate the type.

```ferret
let a := 10;               // Defaults to i32
let b: i8 = 10;            // OK: fits in i8
let big := 5000000000;     // Error: doesn't fit in default i32
let big: i64 = 5000000000; // OK

let a := 10;               // i32
let b: i8 = a;             // Error: narrowing from i32 to i8 needs a cast
let b: i8 = a as i8;        // Explicit cast
```

### Floating‑Point Types

These types store numbers with decimal points. Think of them as numbers that can have fractional parts.

| Type  | Size   | Precision  | Description                |
| ----- | ------ | ---------- | -------------------------- |
| `f32` | 32‑bit | ~7 digits  | Single precision (default) |
| `f64` | 64‑bit | ~15 digits | Double precision           |
| `f128` | 128‑bit | ~34 digits | Quadruple precision float  |
| `f256` | 256‑bit | ~71 digits | Octuple precision float    |

The `f` stands for floating-point, and the numbers `32` and `64` represent the bits used to store the value. The bigger the number, the more precise your decimal calculations will be.

When you write a number with a decimal point without specifying a type and there is no typed context, Ferret uses the default float type (currently `f32`). If the literal does not fit in the default type, it is a compile-time error and you must annotate it with a wider float type. There is no automatic promotion.

```ferret
let pi: f32 = 3.14159;
let e: f64 = 2.718281828459045;
let price := 19.99;  // Inferred as f32
let large_value: f128 = 1.2345678901234567890123456789012345;
let precise_value: f256 = 1.2345678901234567890123456789012345678901234567890123456789012345678901234567890;
```

### Character Type (`char`)

The `char` type represents a **Unicode scalar value** - a single Unicode code point. Characters are 32-bit values (4 bytes) that can hold any valid Unicode character, from ASCII letters to emojis.

Characters are created using single quotes `'`:

```ferret
let letter: char = 'A';
let emoji: char = '💡';
let chinese: char = '中';
let newline: char = '\n';  // Special characters use backslash
```

Unlike strings which hold multiple characters, a `char` holds exactly one Unicode scalar value. Think of `char` as a single Unicode character, while `str` is a sequence of these characters encoded as UTF-8 bytes.

### Byte Type (`byte`)

The `byte` type represents a **single 8-bit unsigned integer** (0-255). It is identical to `u8` internally, but they differ in how they display:

- **`byte`** displays as a character when printed
- **`u8`** displays as a number when printed

Bytes are created using the `b'...'` prefix:

```ferret
import "std/io";

let ascii_byte: byte = b'A';  // Byte literal
let raw_byte: byte = 65;       // Same as b'A' (ASCII value)
let as_u8: u8 = 65;            // Displays as number

io::Println(ascii_byte);  // Prints: A (as character)
io::Println(as_u8);       // Prints: 65 (as number)
```

### Differences: `char` vs `byte` vs `u8`

| Type | Size | Range | Purpose | Literal | Display |
|------|------|-------|---------|---------|----------|
| `char` | 4 bytes | Unicode scalars (0 to 0x10FFFF) | Unicode character | `'A'`, `'💡'` | Character |
| `byte` | 1 byte | 0 to 255 | Raw byte data | `b'A'` | Character |
| `u8` | 1 byte | 0 to 255 | Unsigned integer | `65` | Number |

**When to use each:**
- Use `char` for text processing with full Unicode support
- Use `byte` for ASCII text or when you want to display bytes as characters
- Use `u8` for raw numeric byte values or binary data

### Conversions Between char/byte/u8

```ferret
import "std/io";

// char to numeric
let c: char = 'A';
let num: i32 = c as i32;      // 65 (Unicode code point)

// byte to char
let b: byte = b'X';
let ch: char = b as char;      // 'X'

// Numeric to char
let code := 66;
let letter: char = code as char;  // 'B'

// char to byte (truncates to 8 bits)
let emoji: char = '💡';
let truncated: byte = emoji as byte;  // Loses data! Use with ASCII only
```


### String Type

Strings store text - anything from single letters to entire paragraphs. In Ferret, strings are represented by the `str` type.

You create strings by wrapping text in double quotes `"`.

```ferret
let name: str = "Ferret";
let greeting: str = "Hello, World!";
let emoji: str = "🦦";  // Strings support Unicode, including emojis!

// Strings can span multiple lines
let multiline: str = "Hello
World";
```

Strings are one of the most common types you'll work with. They're perfect for storing names, messages, file paths, and any other text data.

#### String Indexing and Iteration

**Important:** Strings are **not directly indexable or iterable** in Ferret. To work with individual characters or bytes, you must explicitly convert the string to an array:

```ferret
import "std/io";

// ❌ ERROR: Cannot index strings directly
// let s: str = "Hello";
// let first := s[0];  // Compile error!

// ✅ CORRECT: Convert to array first
let s: str = "Hello";

// Convert to []char for Unicode characters
let chars: []char = s as []char;
let first_char: char = chars[0];  // 'H'
io::Println(first_char);

// Convert to []byte for raw UTF-8 bytes
let bytes: []byte = s as []byte;
let first_byte: byte = bytes[0];  // 'H' (as byte)
io::Println(first_byte);
```

#### Iterating Over Strings

To iterate over a string, convert it to an array first:

```ferret
import "std/io";

let text := "Hello";

// Iterate over Unicode characters
for i, ch in (text as []char) {
    io::Println(i, ch);
}

// Iterate over UTF-8 bytes
for i, b in (text as []byte) {
    io::Println(i, b);
}
```

**Why explicit conversion?** Ferret makes the distinction clear:
- `[]char` gives you Unicode code points (4 bytes each)
- `[]byte` gives you raw UTF-8 bytes (1 byte each)
- This prevents confusion about what iteration means for multi-byte characters

#### String Length

Use the `len()` builtin function to get the UTF-8 byte length:

```ferret
let s: str = "Hello";
let byte_len: i32 = len(&s);  // 5 (bytes)

let emoji: str = "💡";
let emoji_len: i32 = len(&emoji);  // 4 (bytes in UTF-8)

// To get character count, convert to array
let char_count: i32 = len(&(emoji as []char));  // 1 (Unicode character)
```

### Boolean Type

Booleans represent yes/no, on/off, or true/false values. There are only two possible values: `true` and `false`.

The type name is `bool`, and booleans are essential for making decisions in your code.

```ferret
let is_active: bool = true;
let is_complete: bool = false;
let has_permission := true;  // Inferred as bool
```

You'll use booleans constantly when writing conditions, like "if the user is logged in" or "while the game is running."

## Compound Types

Compound types are built by combining other types together. They let you group related data.

### Arrays

Arrays are collections that store multiple values of the same type in a specific order. Think of them as numbered containers where each slot holds one value.

There are two kinds of arrays in Ferret:

**Dynamic arrays** automatically grow when you add more elements. Use the `append()` builtin function to append an item to the end of an array.

```ferret
let numbers: []i32 = [1, 2, 3, 4, 5];
let names: []str = ["Alice", "Bob", "Charlie"];
let scores := [95, 87, 92];  // Inferred as []i32

// Dynamic arrays
let arr := [1, 2, 4];  // size 3
append(&mut arr, 43);  // Append using mutable reference
```

Notice the `[]` before the type - this means "an array of" that type. Dynamic arrays have **no bounds checking** - they grow to accommodate any index you use.

**Learn more:** See the [Built-in Functions](/advanced/builtins) documentation for complete details on array operations like `get()`, `set()`, `insert()`, and more.

**Fixed-size arrays** have a set number of elements that cannot change:

```ferret
let days: [7]str = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
let coordinates: [3]f64 = [1.0, 2.5, 3.7];
```

The number in brackets `[7]` tells you exactly how many items the array holds. Fixed-size arrays have **compile-time bounds checking** for constant indices:

```ferret
let arr: [5]i32 = [1, 2, 3, 4, 5];
let x := arr[2];   // OK - index 2 is valid
let y := arr[10];  // Compile error: constant index 10 is out of bounds!

// Runtime indices panic if out of bounds
let i := 10;
let z := arr[i];   // Runtime panic: index out of bounds!
```

#### Negative Indexing

Both array types support **negative indices** to access elements from the end:

```ferret
let numbers: [5]i32 = [10, 20, 30, 40, 50];
let last := numbers[-1];        // 50 (last element)
let second_last := numbers[-2]; // 40 (second to last)
```

Negative indices count backwards: `-1` is the last element, `-2` is second to last, and so on. For fixed-size arrays, out-of-bounds negative **constant** indices are caught at compile-time:

```ferret
let arr: [5]i32 = [1, 2, 3, 4, 5];
let valid := arr[-5];   // OK - first element
let invalid := arr[-6]; // Compile error: constant index -6 is out of bounds!

// Runtime negative indices panic if out of bounds
let i := -10;
let unsafe := arr[i];   // Runtime panic: index out of bounds!
```

**Important:** For safe array access without panics, use the built-in functions:
- `get(&arr, index)` - Returns `T?` (optional), `none` if out of bounds
- `get_or(&arr, index, fallback)` - Returns `T` with fallback if out of bounds
- `has(&arr, index)` - Returns `bool` to check if index is valid

#### Array Safety Summary

| Array Type | Constant Indices | Runtime Indices | Negative Indexing |
|------------|------------------|-----------------|-------------------|
| Fixed-size `[N]T` | ✅ Compile error if out of bounds | ❌ Runtime panic if out of bounds | ✅ Same behavior |
| Dynamic `[]T` | ❌ Runtime panic if out of bounds | ❌ Runtime panic if out of bounds | ✅ Same behavior |

**Both fixed-size and dynamic arrays panic on out-of-bounds access at runtime.** Use the built-in functions (`get()`, `get_or()`, `has()`) for safe access without panics.

## Optional Types

Sometimes you need to represent "I might have a value, or I might not." That's what optional types do.

You make any type optional by adding a question mark `?` after it. An optional type `T?` can hold either a value of type `T` or `none`. The `none` keyword is a constant (like `true` and `false`) that represents the absence of a value.

```ferret
let maybe_number: i32? = 42;      // Has a value (42)
let no_value: str? = none;        // No value (none is a constant like true/false)
let age: i32? = none;              // Starts with no value
```

Optional types help prevent bugs. Instead of crashing when something is missing, Ferret forces you to check if a value exists before using it.

```ferret
import "std/io";

let username: str? = get_username();

if username != none {
    // Safe to use username here
    io::Println("Hello, " + username);
} else {
    io::Println("No username provided");
}
```

This is much safer than many other languages where missing values can cause crashes!

### Maps

Maps are collections that store key-value pairs. Think of them like a dictionary where you look up values using keys instead of positions.

Unlike arrays which use numbers (0, 1, 2...) to access elements, maps let you use any type as a key - strings, numbers, or even custom types!

```ferret
let scores: map[str]i32 = {
    "alice" => 95,
    "bob" => 87,
    "charlie" => 92
} as map[str]i32;

let prices: map[str]f64 = {
    "apple" => 1.99,
    "banana" => 0.99
} as map[str]f64;
```

The syntax `map[KeyType]ValueType` tells Ferret what types the keys and values should be.

#### Accessing Map Values

Ferret provides two ways to access map values:

**Direct indexing** `map[key]` returns the value type `T` directly, but **panics if the key doesn't exist:**

```ferret
let ages := {"alice" => 25, "bob" => 30} as map[str]i32;

// Returns i32 directly (not i32?)
let alice_age: i32 = ages["alice"];  // ✅ 25
let missing: i32 = ages["unknown"];  // ❌ Panic: key not found!
```

**Safe access** with the `get()` builtin returns an optional type:

```ferret
let ages := {"alice" => 25, "bob" => 30} as map[str]i32;

// Returns i32? (optional i32) - key might not exist!
let alice_age: i32? = get(&mut ages, "alice");  // Returns i32? with value 25
let missing: i32? = get(&mut ages, "unknown");   // Returns i32? with value none
```

This is a safety feature! It forces you to think about what happens when a key doesn't exist, preventing crashes.

#### The Coalescing Operator with Maps

The coalescing operator `??` is perfect for providing default values with `get()`:

```ferret
let scores := {"alice" => 95} as map[str]i32;

let alice_score := get(&mut scores, "alice") ?? 0;    // 95
let bob_score := get(&mut scores, "bob") ?? 0;        // 0 (key doesn't exist)
```

Or use the `get_or()` builtin for a more concise syntax:

```ferret
let alice_score := get_or(&mut scores, "alice", 0);  // 95
let bob_score := get_or(&mut scores, "bob", 0);      // 0 (fallback)
```

This pattern is so common you'll use it all the time when working with maps!

**Learn more:** Maps are covered in detail in the [Type System section](/type-system/maps), and see [Built-in Functions](/basics/builtins) for all container operations.

## Reference Types

Reference types let you pass data by reference rather than by copy. Add `&` before a type to make it a reference:

```ferret
type LargeData struct {
    .Buffer: [1000]i32,
    .Metadata: str,
};

// Passes by copy (copies entire struct)
fn process_copy(data: LargeData) { }

// Passes by reference (only copies pointer)
fn process_ref(data: &LargeData) { }
```

References are useful for:
- Avoiding expensive copies of large data
- Sharing data between functions

**Learn more:** References are covered in detail in the [Type System section](/type-system/references).

## Custom Types

Ferret lets you define your own types beyond the built-in ones. The most common custom types are structs, enums, and interfaces.

### Defining Custom Types

You use the `type` keyword to define new structured types:

```ferret
// Define a struct type
type Point struct {
    .X: f64,
    .Y: f64
};

// Define an enum type
type Color enum {
    Red,
    Green,
    Blue
};

let point: Point = { .X = 10.0, .Y = 20.0 } as Point;
let color: Color = Color::Red;
```

These custom types make your code more organized and type-safe. We'll dive deeper into structs, enums, and interfaces in the Type System section.

## Strict Type Checking

Ferret enforces **strict numeric compatibility** for arithmetic operations. Smaller types can be widened implicitly, and the result uses the widened type. Narrowing or lossy conversions still require explicit casting.

### Why This Rule?

1. **No Surprises**: Only safe widening happens implicitly
2. **Performance**: No hidden runtime conversions or checks
3. **Safety**: Prevents accidental truncation or precision loss
4. **Predictability**: The result type is the widest compatible type
5. **Explicit Intent**: Casts document when precision might be lost

### Operands Must Be Compatible

When performing arithmetic operations, operands must be **compatible numeric types**. If one can be safely widened to the other, the operation is allowed and the result uses the wider type:

```ferret
let a: i16 = 100;
let b: i32 = 200;

// ✅ OK: i16 widens to i32
let result := a + b;  // i32
```

If the conversion could lose precision, Ferret requires an explicit cast:

```ferret
let a: i32 = 100;
let b: f32 = 3.5;

// ❌ ERROR: mismatched types in arithmetic: i32 and f32
// let result := a + b;

// ✅ CORRECT: choose a wider float
let result := (a as f64) + (b as f64);  // f64
```

This applies to **all arithmetic operators**: `+`, `-`, `*`, `/`, `%`, and `**`.

### Mixing Integer and Float Types

Integers and floats can be mixed when the integer can be represented exactly in the float type. Otherwise, use an explicit cast:

```ferret
let tiny: i8 = 42;
let floating: f32 = 3.14159;

// ✅ OK: lossless widening to f32
let sum := tiny + floating;  // f32

let integer: i32 = 42;

// ❌ ERROR: potentially lossy
// let sum2 := integer + floating;

// ✅ CORRECT: widen both sides explicitly
let sum2 := (integer as f64) + (floating as f64);  // f64
```

### Different Sized Integers

Widening between integer sizes is implicit:

```ferret
let small: i32 = 100;
let large: i64 = 9223372036854775807;

// ✅ OK: i32 widens to i64
let result := small + large;  // i64

// Explicit narrowing if needed:
let result2 := small + (large as i32);  // i32
```

### Different Sized Floats

Widening between float sizes is also implicit:

```ferret
let f32val: f32 = 3.14;
let f64val: f64 = 2.718281828;

// ✅ OK: f32 widens to f64
let result := f32val + f64val;  // f64
```

### Power Operator

The power operator (`**`) follows the same compatibility rules:

```ferret
let base: i256 = 2;
let exp: i32 = 10;

// ✅ OK: i32 widens to i256
let result := base ** exp;  // result is i256
```

## Type Conversion

Ferret requires explicit casts for narrowing or potentially lossy numeric conversions. Use the `as` keyword to cast between types.

### Casting Between Number Types

Use the `as` keyword to convert between number types:

```ferret
let small: i32 = 42;
let big: i64 = small as i64;    // Convert to bigger integer

let whole: i32 = 100;
let decimal: f64 = whole as f64;  // Convert to floating-point

let pi: f64 = 3.14159;
let rounded: i32 = pi as i32;     // Becomes 3 (decimal part removed)
```

### Common Casting Patterns

**Widening (Safe - No Data Loss):**
```ferret
let small: i32 = 100;
let large := small as i64;      // i32 → i64 (safe)
let huge := small as i256;      // i32 → i256 (safe)

let f32val: f32 = 3.14;
let f64val := f32val as f64;    // f32 → f64 (safe)
```

**Narrowing (Unsafe - Potential Data Loss):**
```ferret
let large: i64 = 9223372036854775807;
let small := large as i32;      // i64 → i32 (truncates!)

let precise: f64 = 3.14159265358979;
let lessPrec := precise as f32; // f64 → f32 (loses precision)
```

:::caution
- Converting from floating-point to integer drops the decimal part - it doesn't round!
- Narrowing conversions (large → small) can cause overflow or precision loss
:::

### Converting To and From Strings
There is no built-in way to convert between strings and other types yet. This is done via standard library functions which will be covered later.

## Summary

You've learned about Ferret's type system! Here's what we covered:

* **Primitive types**: Integers (`i32`, `i64`, `u32`, `u64`), floats (`f32`, `f64`), strings (`str`), booleans (`bool`), characters (`char`), and bytes (`byte`)
* **char vs byte vs u8**: Unicode characters (4 bytes), character bytes (1 byte, displays as char), and numeric bytes (1 byte, displays as number)
* **String handling**: Strings require explicit conversion to `[]char` or `[]byte` for indexing and iteration
* **Compound types**: Arrays and maps that hold multiple values
* **Optional types**: Types that can be a value or `none`
* **Reference types**: Pass data by reference with `&T`
* **Type inference**: Letting Ferret figure out types automatically
* **Type conversion**: Explicitly changing between types

## Next Steps

Now that you know about types, you're ready to learn what you can do with them:

* [Learn about Operators](/basics/operators)  -  Do math, compare values, and more
* [Explore Optional Types in depth](/type-system/optionals)  -  Master safe handling of missing values
* [Understand Structs](/type-system/structs)  -  Create your own custom types
