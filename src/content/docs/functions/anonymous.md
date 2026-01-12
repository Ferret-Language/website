---
title: Anonymous Functions
description: Using anonymous functions, closures, and higher-order functions in Ferret
sidebar:
  order: 3
---

Anonymous functions (also called lambda functions or function literals) are functions without names that can be assigned to variables, passed as arguments, or used immediately.

## Basic Anonymous Functions

Anonymous functions are created using the `fn` keyword without a function name:

```ferret title="run"
import "std/io";

fn main() {
    let greet := fn() {
        io::Println("Hello, World!");
    };

    greet();  // Prints: Hello, World!
}
```

## Parameters and Return Types

Anonymous functions can have parameters and return types just like named functions:

```ferret title="run"
import "std/io";

fn main() {
    let add := fn(a: i32, b: i32) -> i32 {
        return a + b;
    };

    let result := add(5, 3);  // result = 8
    io::Println(result);
}
```

## Immediately Invoked Function Expressions (IIFE)

You can define and call an anonymous function immediately:

```ferret title="run"
import "std/io";

fn main() {
    let result := fn(x: i32) -> i32 {
        return x * x;
    }(5);  // result = 25
    
    io::Println(result);
}
```

This is useful for creating isolated scopes or initializing values:

```ferret title="run"
import "std/io";


type Config struct {
    .Host: str,
    .Port: str,
};

fn main() {
    let config := fn() -> Config {
        return {
            .Host = "localhost",
            .Port = "8080",
        };
    }();

    io::Println("Host: " + config.Host);
    io::Println("Port: " + config.Port);
}
```

## Passing Functions as Parameters

Anonymous functions can be passed as arguments to other functions:

```ferret title="run"
import "std/io";

fn apply_operation(a: i32, b: i32, operation: fn(x: i32, y: i32) -> i32) -> i32 {
    return operation(a, b);
}

fn main() {
    let sum := apply_operation(10, 5, fn(x: i32, y: i32) -> i32 {
        return x + y;
    });  // sum = 15

    let product := apply_operation(10, 5, fn(x: i32, y: i32) -> i32 {
        return x * y;
    });  // product = 50
    
    io::Println(sum);
    io::Println(product);
}
```

## Closures

Anonymous functions can capture variables from their surrounding scope:

```ferret title="run"
import "std/io";

fn create_multiplier(factor: i32) -> fn(_: i32) -> i32 {
    return fn(value: i32) -> i32 {
        return value * factor;  // 'factor' is captured from outer scope
    };
}

fn main() {
    let double := create_multiplier(2);
    let triple := create_multiplier(3);

    io::Println(double(5));  // 10
    io::Println(triple(5));  // 15
}
```

## Higher-Order Functions

Functions that take other functions as parameters or return functions are called higher-order functions:

```ferret title="run"
import "std/io";

fn map_array(arr: []i32, transform: fn(_: i32) -> i32) -> []i32 {
    let result := [] as []i32;
    for value in arr {
        append(&mut result, transform(value));
    }
    return result;
}

fn main() {
    let numbers := [1, 2, 3, 4, 5];
    let squares := map_array(numbers, fn(x: i32) -> i32 {
        return x * x;
    });

    for num in squares {
        io::Print(num);
        io::Print(" ");
    }
    io::Println("");
}
```

## Function Composition

You can combine functions using anonymous functions:

```ferret title="run"
import "std/io";

fn compose(f: fn(_: i32) -> i32, g: fn(_: i32) -> i32) -> fn(_: i32) -> i32 {
    return fn(x: i32) -> i32 {
        return f(g(x));
    };
}

fn main() {
    let add_one := fn(x: i32) -> i32 { return x + 1; };
    let multiply_two := fn(x: i32) -> i32 { return x * 2; };

    let add_one_then_double := compose(multiply_two, add_one);
    let result := add_one_then_double(5);  // ((5 + 1) * 2) = 12
    io::Println(result);
}
```

## Event Handlers and Callbacks

Anonymous functions are commonly used for callbacks:

```ferret title="run"
import "std/io";

type Button struct {
    .Label: str,
    .On_click: fn() -> void,
};

fn create_button(label: str, callback: fn() -> void) -> Button {
    return {
        .Label = label,
        .On_click = callback,
    };
}

fn main() {
    let button := create_button("Click me", fn() {
        io::Println("Button was clicked!");
    });

    button.On_click();  // Prints: Button was clicked!
}
```

## Best Practices

1. **Use anonymous functions for short, simple operations** that don't need to be reused elsewhere.

2. **Consider named functions** for complex logic that might be used in multiple places.

3. **Be mindful of closures** - they capture variables by reference, which can lead to unexpected behavior if the captured variables change.

4. **Use type annotations** for function parameters to make the code clearer:

```ferret
let process := fn(data: []i32, filter: fn(_: i32) -> bool) -> []i32 {
    // Implementation
};
```

## Next Steps

- [Learn about Error Handling](/advanced/errors)
- [Explore Generics](/advanced/generics)
- [Check out the Standard Library](/advanced/builtins)</content>
<parameter name="filePath">/home/fuad/Dev/Ferret-Language/website/src/content/docs/functions/anonymous.md