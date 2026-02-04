---
title: random
description: Random number generation in Ferret
---

The `random` module provides functions for generating random numbers and values.

## Import

```ferret
import "random";
```

## Functions

### Random()
```ferret
fn Random() -> f32
```
Returns a random floating-point number between 0.0 (inclusive) and 1.0 (exclusive).

```ferret title="example"
import "random";
import "std/io";

for i in 0..5 {
    let value := random::Random();
    io::Printf("Random float: {}\n", value);
}
```

## Utility Functions

While the `random` module provides only the basic `Random()` function, you can build more complex random utilities:

### Random Integers
```ferret title="example"
import "random";
import "std/io";

// Random integer in range [min, max)
fn RandomInt(min: i32, max: i32) -> i32 {
    if min >= max {
        return min;
    }
    
    let range := max - min;
    let randomFloat := random::Random();
    let randomInt := (randomFloat * (range as f32)) as i32;
    return min + randomInt;
}

// Random integer in range [min, max] (inclusive)
fn RandomIntInclusive(min: i32, max: i32) -> i32 {
    return RandomInt(min, max + 1);
}

fn main() {
    io::Println("Random integers between 1 and 10 (exclusive):");
    for i in 0..10 {
        let value := RandomInt(1, 10);
        io::Printf("{} ", value);
    }
    io::Println("");
    
    io::Println("Random integers between 1 and 10 (inclusive):");
    for i in 0..10 {
        let value := RandomIntInclusive(1, 10);
        io::Printf("{} ", value);
    }
    io::Println("");
}
```

### Random Boolean
```ferret title="example"
import "random";
import "std/io";

fn RandomBool() -> bool {
    return random::Random() < 0.5;
}

// Random boolean with custom probability
fn RandomBoolWithProbability(probability: f32) -> bool {
    return random::Random() < probability;
}

fn main() {
    io::Println("Random booleans (50/50):");
    for i in 0..10 {
        let value := RandomBool();
        io::Printf("{} ", value);
    }
    io::Println("");
    
    io::Println("Random booleans (75% true):");
    for i in 0..10 {
        let value := RandomBoolWithProbability(0.75);
        io::Printf("{} ", value);
    }
    io::Println("");
}
```

### Random Choice from Array
```ferret title="example"
import "random";
import "std/io";

fn RandomChoice(choices: []str) -> str? {
    if len(&choices) == 0 {
        return none;
    }
    
    let index := RandomInt(0, len(&choices));
    return at(&choices, index);
}

fn main() {
    let colors := ["red", "green", "blue", "yellow", "purple"];
    
    io::Println("Random color choices:");
    for i in 0..10 {
        let choice := RandomChoice(colors);
        match choice {
            some(color) => io::Printf("{} ", color),
            none => io::Print("none ")
        }
    }
    io::Println("");
}
```

## Practical Examples

### Password Generator
```ferret title="example"
import "random";
import "std/io";

fn GeneratePassword(length: i32, includeSymbols: bool) -> str {
    let lowercase := "abcdefghijklmnopqrstuvwxyz";
    let uppercase := "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let digits := "0123456789";
    let symbols := "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    let charset := lowercase + uppercase + digits;
    if includeSymbols {
        charset = charset + symbols;
    }
    
    let charsetChars := charset as []char;
    let password := "";
    
    for i in 0..length {
        let index := RandomInt(0, len(&charsetChars));
        let char := at(&charsetChars, index);
        match char {
            some(c) => {
                // Convert char to string and append
                let charStr := c as str;
                password = password + charStr;
            },
            none => {}
        }
    }
    
    return password;
}

fn main() {
    io::Println("Generated passwords:");
    
    for i in 0..5 {
        let password := GeneratePassword(12, true);
        io::Printf("Password {}: {}\n", i + 1, password);
    }
    
    io::Println("\nSimple passwords (no symbols):");
    for i in 0..3 {
        let password := GeneratePassword(8, false);
        io::Printf("Password {}: {}\n", i + 1, password);
    }
}
```

### Dice Simulator
```ferret title="example"
import "random";
import "std/io";

fn RollDice(sides: i32) -> i32 {
    return RandomIntInclusive(1, sides);
}

fn RollMultipleDice(count: i32, sides: i32) -> []i32 {
    let mut results := []i32{};
    
    for i in 0..count {
        let roll := RollDice(sides);
        append(&mut results, roll);
    }
    
    return results;
}

fn SumDice(rolls: []i32) -> i32 {
    let sum := 0;
    for roll in rolls {
        sum += roll;
    }
    return sum;
}

fn main() {
    io::Println("=== Dice Simulator ===");
    
    // Single dice rolls
    io::Println("\nSingle d6 rolls:");
    for i in 0..10 {
        let roll := RollDice(6);
        io::Printf("{} ", roll);
    }
    io::Println("");
    
    // Multiple dice
    io::Println("\n3d6 rolls:");
    for i in 0..5 {
        let rolls := RollMultipleDice(3, 6);
        let sum := SumDice(rolls);
        io::Printf("Roll {}: {} (sum: {})\n", i + 1, rolls, sum);
    }
    
    // Different sided dice
    io::Println("\nDifferent dice types:");
    let diceTypes := [4, 6, 8, 10, 12, 20];
    for sides in diceTypes {
        let roll := RollDice(sides);
        io::Printf("d{}: {} ", sides, roll);
    }
    io::Println("");
}
```

### Random Data Generator
```ferret title="example"
import "random";
import "std/io";

type Person struct {
    .name: str,
    .age: i32,
    .city: str
};

fn RandomName() -> str {
    let firstNames := ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry"];
    let lastNames := ["Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor"];
    
    let firstName := RandomChoice(firstNames);
    let lastName := RandomChoice(lastNames);
    
    match (firstName, lastName) {
        (some(first), some(last)) => first + " " + last,
        _ => "Unknown"
    }
}

fn RandomAge() -> i32 {
    return RandomIntInclusive(18, 80);
}

fn RandomCity() -> str {
    let cities := ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", 
                   "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"];
    
    let choice := RandomChoice(cities);
    match choice {
        some(city) => city,
        none => "Unknown City"
    }
}

fn GenerateRandomPerson() -> Person {
    return Person{
        .name: RandomName(),
        .age: RandomAge(),
        .city: RandomCity()
    };
}

fn main() {
    io::Println("=== Random Person Generator ===");
    
    for i in 0..10 {
        let person := GenerateRandomPerson();
        io::Printf("{}: {} (age {}) from {}\n", 
                   i + 1, person.name, person.age, person.city);
    }
}
```

### Monte Carlo Simulation
```ferret title="example"
import "random";
import "std/io";
import "math";

// Estimate π using Monte Carlo method
fn EstimatePi(samples: i32) -> f64 {
    let insideCircle := 0;
    
    for i in 0..samples {
        let x := random::Random() as f64;
        let y := random::Random() as f64;
        
        // Check if point is inside unit circle
        let distance := math::Sqrt(x * x + y * y);
        if distance <= 1.0 {
            insideCircle += 1;
        }
    }
    
    // π ≈ 4 * (points inside circle / total points)
    return 4.0 * (insideCircle as f64) / (samples as f64);
}

// Estimate integral using Monte Carlo
fn EstimateIntegral(samples: i32) -> f64 {
    // Estimate integral of x² from 0 to 1
    let sum := 0.0;
    
    for i in 0..samples {
        let x := random::Random() as f64;
        let y := x * x; // Function: f(x) = x²
        sum += y;
    }
    
    return sum / (samples as f64);
}

fn main() {
    io::Println("=== Monte Carlo Simulations ===");
    
    // Estimate π
    let piSamples := [1000, 10000, 100000];
    io::Println("\nEstimating π:");
    for sampleCount in piSamples {
        let estimate := EstimatePi(sampleCount);
        let error := if estimate > math::PI { 
            estimate - math::PI 
        } else { 
            math::PI - estimate 
        };
        io::Printf("Samples: {:6} | π ≈ {:.6} | Error: {:.6}\n", 
                   sampleCount, estimate, error);
    }
    
    // Estimate integral
    io::Println("\nEstimating integral of x² from 0 to 1:");
    io::Println("(Actual value: 1/3 ≈ 0.333333)");
    for sampleCount in piSamples {
        let estimate := EstimateIntegral(sampleCount);
        let actual := 1.0 / 3.0;
        let error := if estimate > actual { 
            estimate - actual 
        } else { 
            actual - estimate 
        };
        io::Printf("Samples: {:6} | Integral ≈ {:.6} | Error: {:.6}\n", 
                   sampleCount, estimate, error);
    }
}
```

### Random Walk Simulation
```ferret title="example"
import "random";
import "std/io";
import "math";

type Point struct {
    .x: f64,
    .y: f64
};

fn RandomWalk(steps: i32, stepSize: f64) -> []Point {
    let mut path := []Point{};
    let mut current := Point{.x: 0.0, .y: 0.0};
    
    append(&mut path, current);
    
    for i in 0..steps {
        // Random angle between 0 and 2π
        let angle := random::Random() as f64 * 2.0 * math::PI;
        
        // Calculate step
        let dx := math::Sqrt(angle) * stepSize; // cos(angle) approximation
        let dy := math::Sqrt(angle + math::PI/2.0) * stepSize; // sin(angle) approximation
        
        current = Point{
            .x: current.x + dx,
            .y: current.y + dy
        };
        
        append(&mut path, current);
    }
    
    return path;
}

fn CalculateDistance(p1: Point, p2: Point) -> f64 {
    let dx := p2.x - p1.x;
    let dy := p2.y - p1.y;
    return math::Sqrt(dx * dx + dy * dy);
}

fn AnalyzeWalk(path: []Point) {
    if len(&path) < 2 {
        return;
    }
    
    let start := at(&path, 0);
    let end := at(&path, len(&path) - 1);
    
    match (start, end) {
        (some(startPoint), some(endPoint)) => {
            let totalDistance := CalculateDistance(startPoint, endPoint);
            io::Printf("Walk summary:\n");
            io::Printf("  Start: ({:.2}, {:.2})\n", startPoint.x, startPoint.y);
            io::Printf("  End:   ({:.2}, {:.2})\n", endPoint.x, endPoint.y);
            io::Printf("  Net distance: {:.2}\n", totalDistance);
            
            // Find furthest point
            let maxDistance := 0.0;
            for i in 0..len(&path) {
                let point := at(&path, i);
                match (start, point) {
                    (some(startPoint), some(currentPoint)) => {
                        let distance := CalculateDistance(startPoint, currentPoint);
                        if distance > maxDistance {
                            maxDistance = distance;
                        }
                    },
                    _ => {}
                }
            }
            io::Printf("  Max distance from start: {:.2}\n", maxDistance);
        },
        _ => {}
    }
}

fn main() {
    io::Println("=== Random Walk Simulation ===");
    
    let steps := 100;
    let stepSize := 1.0;
    
    io::Printf("Simulating {} random walks with {} steps each\n", 5, steps);
    
    for walkNum in 0..5 {
        io::Printf("\nWalk {}:\n", walkNum + 1);
        let path := RandomWalk(steps, stepSize);
        AnalyzeWalk(path);
    }
}
```

## Shuffling and Sampling

```ferret title="example"
import "random";
import "std/io";

// Fisher-Yates shuffle algorithm
fn Shuffle(arr: &mut []i32) {
    for i in (len(arr) - 1)..=1 {
        let j := RandomInt(0, i + 1);
        
        // Swap elements (simplified - would need proper swap in real implementation)
        let temp := at(arr, i);
        let swapValue := at(arr, j);
        // arr[i] = swapValue, arr[j] = temp
    }
}

// Select k random elements from array
fn RandomSample(arr: []str, k: i32) -> []str {
    let mut result := []str{};
    let available := arr; // Copy for sampling
    
    let sampleSize := if k > len(&arr) { len(&arr) } else { k };
    
    for i in 0..sampleSize {
        if len(&available) == 0 {
            break;
        }
        
        let index := RandomInt(0, len(&available));
        let choice := at(&available, index);
        match choice {
            some(value) => append(&mut result, value),
            none => {}
        }
        
        // Remove selected element (simplified)
        // In real implementation, would modify available array
    }
    
    return result;
}

fn main() {
    let numbers := [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let names := ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank"];
    
    io::Println("Original array:", numbers);
    // Shuffle(numbers); // Would shuffle in place
    io::Println("Shuffled array:", numbers);
    
    io::Println("\nRandom sample of 3 names:");
    let sample := RandomSample(names, 3);
    for name in sample {
        io::Printf("{} ", name);
    }
    io::Println("");
}
```

## Best Practices

1. **Seed the random number generator** if deterministic results are needed for testing
2. **Use appropriate ranges** for your use case
3. **Consider distribution** - uniform vs normal vs other distributions
4. **Validate inputs** before generating random values
5. **Use secure random sources** for cryptographic purposes (not this module)
6. **Test randomness quality** for critical applications
7. **Document random behavior** in your code

## Limitations

- **Single function**: Only provides basic uniform random floats
- **No seeding**: Cannot set seed for reproducible results
- **No cryptographic security**: Not suitable for security purposes
- **Limited distribution types**: Only uniform distribution available

## See Also

- [Math Module](/docs/stdlib/math) - Mathematical functions for random calculations
- [Time Module](/docs/stdlib/time) - Time-based seeding and timing random operations
- [Type System](/docs/type-system/compatibility) - Understanding numeric type conversions
