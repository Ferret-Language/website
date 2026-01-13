---
title: Structs
description: Defining and using structs in Ferret
sidebar:
  order: 4
---

Structs are custom data types that group related data together.

## Struct Definition

```ferret
type Person struct {
    .Name: str,
    .Age: i32,
    .Email: str,
};
```

## Creating Instances

Create struct instances using composite literal syntax with the `as` cast:

```ferret
let person := {
    .Name = "Alice",
    .Age = 30,
    .Email = "alice@example.com"
} as Person;

// Or with explicit type annotation
let another_person: Person = {
    .Name = "Bob",
    .Age = 25,
    .Email = "bob@example.com"
} as Person;
```

:::tip
Notice we use `=` (equals) in struct literals. The `.` prefix indicates a struct field.
:::

## Accessing Fields

```ferret
let name := person.Name;   // Alice
let age := person.Age;     // 30
```

## Visibility

Struct fields can be public or private. Which means, they can be accessed from outside the struct's scope. Public fields are prefixed with a capital letter, while private fields are prefixed with a lowercase letter.
```ferret title="run"
import "std/io";

type Person struct {
    .Name: str,
    .age: i32,
    .Email: str,
};

fn (p: Person) GetAge() -> i32 {
    return p.age;
}

fn main() {
    let person := {
        .Name = "Alice",
        .age = 30,
        .Email = "alice@example.com"
    } as Person;

    io::Println("Name: {}", person.Name);
    io::Println("Age: {}", person.GetAge());
    io::Println("Email: {}", person.Email);
}
```

```ferret
// Anonymous struct with explicit type
let point: struct{ .X: i32, .Y: i32 } = {
    .X = 10,
    .Y = 20
} as struct{ .X: i32, .Y: i32 };

// Inferred anonymous struct (Ferret figures out the type)
let coordinate := {
    .X = 5,
    .Y = 15
};  // Type is inferred from the literal
```

Anonymous structs are great for one-off data grouping when you don't need a named type.

## Next Steps

- [Learn about Methods](/type-system/methods) - Add behavior to your types
- [Explore Enums](/type-system/enums) - Define sets of named values
- [Understand Maps](/type-system/maps) - Store key-value pairs
- [Master Interfaces](/type-system/interfaces) - Define behavior contracts
