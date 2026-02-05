---
title: If Statements
description: Learn about conditional logic in Ferret
sidebar:
  order: 1
---

Programs often need to make decisions: "If the user is logged in, show their profile. Otherwise, show the login page." That's where **if statements** come in.

If statements let your code choose different paths based on conditions. They're one of the most fundamental building blocks of programming.

## Basic If Statement

The simplest form checks one condition. If it's true, the code inside the curly braces `{ }` runs. If it's false, the code is skipped:

```ferret
import "std/io";

let age := 18;

if age >= 18 {
    io::Println("You are an adult");
}

// Program continues here either way
```

The pattern is:
```ferret
if condition {
    // code that runs when condition is true
}
```

Let's see more examples:

```ferret
import "std/io";

let temperature := 75;

if temperature > 80 {
    io::Println("It's hot outside!");
}

let has_permission := true;

if has_permission {
    io::Println("Access granted");
}

let score := 95;

if score >= 90 {
    io::Println("Excellent work!");
}
```

## If-Else: Choosing Between Two Paths

Often you want to do one thing if a condition is true, and something different if it's false. That's what `else` is for:

```ferret
import "std/io";

let score := 75;

if score >= 60 {
    io::Println("You passed!");
} else {
    io::Println("You failed. Try again!");
}
```

The pattern is:
```ferret
if condition {
    // runs when condition is true
} else {
    // runs when condition is false
}
```

**Exactly one** of these blocks will run - never both, never neither.

More examples:

```ferret
import "std/io";

let is_weekend := true;

if is_weekend {
    io::Println("Time to relax!");
} else {
    io::Println("Back to work");
}

let balance := 50;
let price := 30;

if balance >= price {
    io::Println("Purchase approved");
    balance -= price;
} else {
    io::Println("Insufficient funds");
}
```

## If-Else If-Else: Choosing Between Multiple Paths

When you have more than two possibilities, use `else if` to add extra conditions:

```ferret
import "std/io";

let grade := 85;

if grade >= 90 {
    io::Println("A - Excellent!");
} else if grade >= 80 {
    io::Println("B - Good job!");
} else if grade >= 70 {
    io::Println("C - Passing");
} else if grade >= 60 {
    io::Println("D - Needs improvement");
} else {
    io::Println("F - Failed");
}
```

Ferret checks each condition **in order** from top to bottom:
1. First it checks `grade >= 90`
2. If that's false, it checks `grade >= 80`
3. If that's false, it checks `grade >= 70`
4. And so on...
5. If all conditions are false, it runs the `else` block

**Important:** As soon as one condition is true, that block runs and the rest are skipped.

```ferret
import "std/io";

let time_of_day := 14;  // 2 PM in 24-hour format

if time_of_day < 12 {
    io::Println("Good morning!");
} else if time_of_day < 17 {
    io::Println("Good afternoon!");
} else if time_of_day < 21 {
    io::Println("Good evening!");
} else {
    io::Println("Good night!");
}
```

You can have as many `else if` blocks as you need. The final `else` is optional - if you leave it out and all conditions are false, nothing happens:

```ferret
import "std/io";

let age := 15;

if age >= 18 {
    io::Println("You can vote");
} else if age >= 16 {
    io::Println("You can drive");
}
// If age is less than 16, nothing prints
```

## Type Narrowing with Optionals

Here's where Ferret gets really clever. When you check if an optional value is `none`, Ferret automatically adjusts the type inside each branch.

Remember optional types from the Types lesson? They can be either a value or `none`. Normally, you can't use them directly:

```ferret
let maybe_value: ?i32 = 42;

// This won't work:
// let doubled := maybe_value * 2;  // ERROR: Can't multiply ?i32
```

But after checking for `none`, Ferret knows the type more precisely:

```ferret
import "std/io";

let maybe_value: ?i32 = 42;

if maybe_value != none {
    // Inside here, maybe_value is treated as i32 (not ?i32)
    // because Ferret knows it's not none
    let doubled: i32 = maybe_value * 2;  // Works!
    io::Println(doubled);  // Prints: 84
} else {
    // Inside here, maybe_value is known to be none
    io::Println("No value");
}
```

This is called **type narrowing** or **flow-sensitive typing**. Ferret understands your checks and makes the type more specific in each branch.

Another example:

```ferret
import "std/io";

let username: ?str = get_user_input();

if username != none {
    // username is str here
    io::Println("Hello, " + username + "!");
    let length: i32 = len(&username);
} else {
    // username is none here
    io::Println("Please enter a username");
}
```

You can also use `==` to check:

```ferret
import "std/io";

let opt_count: ?i32 = get_count();

if opt_count == none {
    // opt_count is none here
    io::Println("No count available");
} else {
    // opt_count is i32 here
    io::Println("Count: " + opt_count.to_string());
}
```

This feature makes working with optional types safe and convenient. You're forced to handle the `none` case, preventing null pointer errors!


## Nested If Statements

You can put if statements inside other if statements:

```ferret
import "std/io";

let age := 25;
let has_license := true;

if age >= 18 {
    if has_license {
        io::Println("You can drive");
    } else {
        io::Println("You need a license");
    }
} else {
    io::Println("You're too young to drive");
}
```

However, it's often clearer to use logical operators instead:

```ferret
import "std/io";

let age := 25;
let has_license := true;

if age >= 18 and has_license {
    io::Println("You can drive");
} else if age >= 18 {
    io::Println("You need a license");
} else {
    io::Println("You're too young to drive");
}
```

## Summary

You've learned how to make decisions in your code:

* Use `if` to run code conditionally
* Use `if-else` to choose between two paths
* Use `if-else if-else` to choose between multiple paths
* Ferret narrows optional types automatically in if statements
* You can nest if statements or use logical operators for complex conditions

## Next Steps

Now that you can make decisions, learn how to repeat actions:

* [Learn about Loops](/control-flow/loops)  -  Repeat code efficiently
* [Explore Match Expressions](/control-flow/match)  -  Advanced pattern matching
* [Understand Optional Types](/type-system/optionals)  -  Master safe value handling
