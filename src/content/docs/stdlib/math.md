---
title: math
description: Mathematical functions and constants in Ferret
---

The `math` module provides mathematical functions and constants for numerical computations.

## Import

```ferret
import "math";
```

## Constants

### PI
```ferret
const PI := 3.1416;
```
The mathematical constant π (pi), approximately 3.14159.

```ferret title="example"
import "math";
import "std/io";

// Calculate circle area
let radius := 5.0;
let area := math::PI * radius * radius;
io::Printf("Circle area: {}\n", area);

// Calculate circle circumference
let circumference := 2.0 * math::PI * radius;
io::Printf("Circle circumference: {}\n", circumference);
```

## Functions

### Sqrt()
```ferret
fn Sqrt(number: f64) -> f64
```
Returns the square root of a number.

```ferret title="example"
import "math";
import "std/io";

let value := 25.0;
let result := math::Sqrt(value);
io::Printf("√{} = {}\n", value, result); // √25 = 5

// Pythagorean theorem
let a := 3.0;
let b := 4.0;
let c := math::Sqrt(a * a + b * b);
io::Printf("Hypotenuse: {}\n", c); // 5
```

### Floor()
```ferret
fn Floor(number: f64) -> i64
```
Returns the largest integer less than or equal to the given number.

```ferret title="example"
import "math";
import "std/io";

let values := [3.7, -2.1, 5.0, -0.9];
for value in values {
    let floored := math::Floor(value);
    io::Printf("floor({}) = {}\n", value, floored);
}
// Output:
// floor(3.7) = 3
// floor(-2.1) = -3
// floor(5.0) = 5
// floor(-0.9) = -1
```

## Mathematical Operations

Ferret also supports built-in mathematical operations:

### Power Operation
```ferret title="example"
import "math";
import "std/io";

// Using built-in power operator
let base := 2.0;
let exponent := 3.0;
let result := base ** exponent;
io::Printf("{} ^ {} = {}\n", base, exponent, result); // 2 ^ 3 = 8

// Square root using power
let number := 16.0;
let sqrt := number ** 0.5;
io::Printf("√{} = {}\n", number, sqrt); // √16 = 4
```

### Basic Arithmetic
```ferret title="example"
import "std/io";

// Basic operations
let a := 10;
let b := 3;

io::Printf("{} + {} = {}\n", a, b, a + b);  // 13
io::Printf("{} - {} = {}\n", a, b, a - b);  // 7
io::Printf("{} * {} = {}\n", a, b, a * b);  // 30
io::Printf("{} / {} = {}\n", a, b, a / b);  // 3 (integer division)
io::Printf("{} % {} = {}\n", a, b, a % b);  // 1 (modulo)
```

## Practical Examples

### Distance Calculator
```ferret title="example"
import "math";
import "std/io";

type Point struct {
    .x: f64,
    .y: f64
};

fn distance(p1: Point, p2: Point) -> f64 {
    let dx := p2.x - p1.x;
    let dy := p2.y - p1.y;
    return math::Sqrt(dx * dx + dy * dy);
}

fn main() {
    let pointA := Point{.x: 0.0, .y: 0.0};
    let pointB := Point{.x: 3.0, .y: 4.0};
    
    let dist := distance(pointA, pointB);
    io::Printf("Distance between points: {}\n", dist);
}
```

### Geometric Calculations
```ferret title="example"
import "math";
import "std/io";

// Circle calculations
fn circleArea(radius: f64) -> f64 {
    return math::PI * radius * radius;
}

fn circleCircumference(radius: f64) -> f64 {
    return 2.0 * math::PI * radius;
}

// Rectangle calculations
fn rectangleArea(width: f64, height: f64) -> f64 {
    return width * height;
}

fn rectanglePerimeter(width: f64, height: f64) -> f64 {
    return 2.0 * (width + height);
}

// Triangle calculations
fn triangleArea(base: f64, height: f64) -> f64 {
    return 0.5 * base * height;
}

fn main() {
    // Circle
    let radius := 5.0;
    io::Printf("Circle (r={}): area={}, circumference={}\n", 
               radius, circleArea(radius), circleCircumference(radius));
    
    // Rectangle
    let width := 4.0;
    let height := 3.0;
    io::Printf("Rectangle ({}x{}): area={}, perimeter={}\n",
               width, height, rectangleArea(width, height), 
               rectanglePerimeter(width, height));
    
    // Triangle
    let base := 6.0;
    let triHeight := 4.0;
    io::Printf("Triangle (base={}, height={}): area={}\n",
               base, triHeight, triangleArea(base, triHeight));
}
```

### Statistics Functions
```ferret title="example"
import "math";
import "std/io";

fn average(numbers: []f64) -> f64 {
    if len(&numbers) == 0 {
        return 0.0;
    }
    
    let sum := 0.0;
    for number in numbers {
        sum += number;
    }
    
    return sum / (len(&numbers) as f64);
}

fn standardDeviation(numbers: []f64) -> f64 {
    if len(&numbers) <= 1 {
        return 0.0;
    }
    
    let avg := average(numbers);
    let sumSquaredDiffs := 0.0;
    
    for number in numbers {
        let diff := number - avg;
        sumSquaredDiffs += diff * diff;
    }
    
    let variance := sumSquaredDiffs / (len(&numbers) as f64);
    return math::Sqrt(variance);
}

fn main() {
    let data := [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
    
    let avg := average(data);
    let stdDev := standardDeviation(data);
    
    io::Printf("Data: {:?}\n", data);
    io::Printf("Average: {}\n", avg);
    io::Printf("Standard Deviation: {}\n", stdDev);
}
```

### Number Theory Functions
```ferret title="example"
import "math";
import "std/io";

fn gcd(a: i64, b: i64) -> i64 {
    let x := if a < 0 { -a } else { a }; // abs(a)
    let y := if b < 0 { -b } else { b }; // abs(b)
    
    while y != 0 {
        let temp := y;
        y = x % y;
        x = temp;
    }
    
    return x;
}

fn lcm(a: i64, b: i64) -> i64 {
    if a == 0 || b == 0 {
        return 0;
    }
    
    let absA := if a < 0 { -a } else { a };
    let absB := if b < 0 { -b } else { b };
    
    return (absA * absB) / gcd(a, b);
}

fn isPrime(n: i64) -> bool {
    if n <= 1 {
        return false;
    }
    if n <= 3 {
        return true;
    }
    if n % 2 == 0 || n % 3 == 0 {
        return false;
    }
    
    let i := 5;
    while i * i <= n {
        if n % i == 0 || n % (i + 2) == 0 {
            return false;
        }
        i += 6;
    }
    
    return true;
}

fn factorial(n: i64) -> i64 {
    if n <= 1 {
        return 1;
    }
    
    let result := 1;
    for i in 2..=n {
        result *= i;
    }
    
    return result;
}

fn main() {
    // GCD and LCM
    let a := 48;
    let b := 18;
    io::Printf("gcd({}, {}) = {}\n", a, b, gcd(a, b));
    io::Printf("lcm({}, {}) = {}\n", a, b, lcm(a, b));
    
    // Prime check
    let numbers := [2, 3, 4, 17, 25, 29, 100];
    for num in numbers {
        let prime := if isPrime(num) { "prime" } else { "not prime" };
        io::Printf("{} is {}\n", num, prime);
    }
    
    // Factorials
    for i in 0..=10 {
        io::Printf("{}! = {}\n", i, factorial(i));
    }
}
```

### Approximation Functions
```ferret title="example"
import "math";
import "std/io";

// Approximate sine using Taylor series (first few terms)
fn approxSin(x: f64, terms: i32) -> f64 {
    let result := 0.0;
    let term := x; // First term
    
    for n in 0..terms {
        if n % 2 == 0 {
            result += term;
        } else {
            result -= term;
        }
        
        // Next term: multiply by x^2 and divide by (2n+2)(2n+3)
        let denominator := (2 * n + 2) * (2 * n + 3);
        term = term * x * x / (denominator as f64);
    }
    
    return result;
}

// Approximate e^x using Taylor series
fn approxExp(x: f64, terms: i32) -> f64 {
    let result := 1.0; // e^0 = 1
    let term := 1.0;
    
    for n in 1..terms {
        term = term * x / (n as f64);
        result += term;
    }
    
    return result;
}

fn main() {
    let angle := math::PI / 6.0; // 30 degrees in radians
    let sinApprox := approxSin(angle, 10);
    io::Printf("sin(π/6) ≈ {}\n", sinApprox); // Should be 0.5
    
    let x := 1.0;
    let expApprox := approxExp(x, 20);
    io::Printf("e^1 ≈ {}\n", expApprox); // Should be ≈2.718
}
```

## Advanced Mathematics

### Complex Number Simulation
```ferret title="example"
import "math";
import "std/io";

type Complex struct {
    .real: f64,
    .imag: f64
};

fn complexAdd(a: Complex, b: Complex) -> Complex {
    return Complex{
        .real: a.real + b.real,
        .imag: a.imag + b.imag
    };
}

fn complexMultiply(a: Complex, b: Complex) -> Complex {
    return Complex{
        .real: a.real * b.real - a.imag * b.imag,
        .imag: a.real * b.imag + a.imag * b.real
    };
}

fn complexMagnitude(c: Complex) -> f64 {
    return math::Sqrt(c.real * c.real + c.imag * c.imag);
}

fn complexToString(c: Complex) -> str {
    if c.imag >= 0.0 {
        return (c.real as str) + "+" + (c.imag as str) + "i";
    } else {
        return (c.real as str) + (c.imag as str) + "i";
    }
}

fn main() {
    let a := Complex{.real: 3.0, .imag: 4.0};
    let b := Complex{.real: 1.0, .imag: -2.0};
    
    let sum := complexAdd(a, b);
    let product := complexMultiply(a, b);
    let magA := complexMagnitude(a);
    
    io::Printf("a = {}\n", complexToString(a));
    io::Printf("b = {}\n", complexToString(b));
    io::Printf("a + b = {}\n", complexToString(sum));
    io::Printf("a * b = {}\n", complexToString(product));
    io::Printf("|a| = {}\n", magA);
}
```

## Best Practices

1. **Check for edge cases** - Division by zero, negative square roots, etc.
2. **Use appropriate precision** - Consider floating-point precision limitations
3. **Handle overflow** - Large numbers may overflow integer types
4. **Document units** - Radians vs degrees, meters vs feet, etc.
5. **Validate inputs** - Ensure numbers are in valid ranges
6. **Use constants** - Define mathematical constants for clarity

## Future Extensions

The math module could be extended with additional functions:

- Trigonometric functions (sin, cos, tan, etc.)
- Logarithmic functions (ln, log10, log2)
- Hyperbolic functions (sinh, cosh, tanh)
- Advanced statistical functions
- Matrix operations
- Random number utilities

## See Also

- [Random Module](/docs/stdlib/random) - Random number generation
- [Type System](/docs/type-system/compatibility) - Understanding numeric types
- [Variables](/docs/basics/variables) - Working with numeric variables
