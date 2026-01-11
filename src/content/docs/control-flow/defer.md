---
title: Defer
description: Defer statement for cleanup and resource management in Ferret
sidebar:
  order: 4
---

The `defer` statement schedules a function call to execute when the current scope exits, enabling clean and reliable resource cleanup.

## Basic Usage

Defer statements execute in **LIFO (Last In, First Out)** order when the enclosing scope exits:

```ferret title="run"
import "std/io";

fn main() {
    defer io::Println("third");
    defer io::Println("second");
    defer io::Println("first");
    
    io::Println("body");
}
```
```txt title="Output"
body
first
second
third
```

## Scope-based Execution

Unlike some languages where defer runs only at function exit, Ferret's defer is **scope-based** - it runs when any enclosing block exits:

### Block Scopes

```ferret
fn example() {
    io::Println("start");
    
    {
        defer io::Println("block defer");
        io::Println("inside block");
    }  // defer executes here
    
    io::Println("after block");
}
```
```txt title="Output"
start
inside block
block defer
after block
```

### Loop Scopes

Each loop iteration creates a new scope, so defers execute at the end of each iteration:

```ferret
fn loopExample() {
    for i in 0..3 {
        defer io::Println(i);
        io::Println("iteration");
    }
}
```
```txt title="Output"
iteration
0
iteration
1
iteration
2
```

### If Statement Scopes

```ferret
fn conditional(x: i32) {
    if x > 0 {
        defer io::Println("positive cleanup");
        io::Println("positive branch");
    } else {
        defer io::Println("non-positive cleanup");
        io::Println("non-positive branch");
    }
}
```

## Defer with Error Handling

Defer can be combined with error handling using `catch` clauses. When a deferred function returns a `Result` type, you can handle errors that occur during cleanup:

```ferret title="run"
import "std/io";

fn mayFail() -> str ! str {
    return "cleanup error"!;
}

fn main() {
    io::Println("Start");
    
    defer mayFail() catch err {
        // This executes ONLY if mayFail() returns an error
        io::Println("Caught error in defer:", err);
    };
    
    io::Println("End");
}
```
```txt title="Output"
Start
End
Caught error in defer: cleanup error
```

### How Defer with Catch Works

The catch block in a defer statement is **diagnostic-only** and executes conditionally:

1. **If the deferred call succeeds** (returns Ok): The catch block is skipped
2. **If the deferred call fails** (returns Err): The catch block executes with the error

```ferret title="run"
import "std/io";

fn successfulCleanup() -> str ! str {
    io::Println("  Cleanup succeeded");
    return "ok";
}

fn failingCleanup() -> str ! str {
    io::Println("  Cleanup failed");
    return "error"!;
}

fn main() {
    io::Println("Test 1: Success case");
    defer successfulCleanup() catch err {
        io::Println("  Catch:", err);
    };
    
    io::Println("Test 2: Error case");
    defer failingCleanup() catch err {
        io::Println("  Catch:", err);
    };
}
```
```txt title="Output"
Test 1: Success case
Test 2: Error case
  Cleanup failed
  Catch: error
  Cleanup succeeded
```

### Important: Catch is Diagnostic-Only

The catch block in defer is for **error logging and diagnostics** only. Unlike regular catch blocks, **it cannot alter control flow or return values**:

```ferret
fn example() -> i32 {
    defer mayFail() catch err {
        // You can log the error
        io::Println("Defer error:", err);
        
        // But return statements here do NOT affect the function's return value
        // return 42;  // This would be ignored
    };
    
    return 10;  // This is what the function returns
}
```

This design ensures that:
- Cleanup errors can be logged and observed
- The original function's control flow and return value are preserved
- Defer remains focused on cleanup, not altering program behavior

## Control Flow with Defer

Defer statements respect control flow:

### Break

```ferret
for i in 0..10 {
    if i == 5 {
        defer io::Println("breaking at", i);
        break;  // defer runs before break exits loop
    }
    defer io::Println("iteration", i);
}
```

All defers in scopes being exited will execute before the break completes.

### Continue

```ferret
for i in 0..5 {
    defer io::Println("end of iteration", i);
    
    if i % 2 == 0 {
        continue;  // defer runs before continue
    }
    
    io::Println("odd:", i);
}
```

### Return

```ferret
fn cleanup() {
    defer io::Println("final cleanup");
    
    if someCondition {
        defer io::Println("early cleanup");
        return;  // Both defers execute: early first, then final
    }
    
    io::Println("normal path");
}
```

All defers from all scopes execute before the function returns, in reverse order of declaration.

## Common Patterns

### Resource Cleanup

```ferret
fn processResource() {
    let file := openFile("data.txt");
    defer file.close();
    
    // Use file...
    // file.close() automatically called on scope exit
}
```

### Resource Cleanup with Error Handling

```ferret title="run"
import "std/io";

fn closeResource() -> str ! str {
    io::Println("  Closing resource...");
    return "close failed"!;  // Simulating a close error
}

fn processData() {
    io::Println("Opening resource");
    defer closeResource() catch err {
        io::Println("  Warning: Resource cleanup failed:", err);
    };
    
    io::Println("Processing data");
}

fn main() {
    processData();
    io::Println("Done");
}
```
```txt title="Output"
Opening resource
Processing data
  Closing resource...
  Warning: Resource cleanup failed: close failed
Done
```

### Transaction Management

```ferret title="run"
import "std/io";

fn commitTransaction() -> str ! str {
    io::Println("  Committing...");
    // Simulate transaction commit
    return "commit succeeded";
}

fn rollbackTransaction() {
    io::Println("  Rolling back transaction");
}

fn transaction() -> bool {
    io::Println("Begin transaction");
    
    defer commitTransaction() catch err {
        io::Println("  Commit failed:", err);
        rollbackTransaction();
    };
    
    io::Println("Performing operations...");
    return true;
}

fn main() {
    let result := transaction();
    io::Println("Transaction completed:", result);
}
```
```txt title="Output"
Begin transaction
Performing operations...
  Committing...
Transaction completed: true
```

### Lock Management

```ferret
fn criticalSection() {
    mutex.lock();
    defer mutex.unlock();
    
    // Critical section code...
    // unlock automatically called
}
```

## Execution Order Summary

1. **Within a scope**: Defers execute in LIFO order (last declared, first executed)
2. **Across scopes**: Inner scope defers execute before outer scope defers
3. **On return**: All defers from all scopes execute before function returns
4. **On break/continue**: Defers in exiting scopes execute before control transfer
5. **With catch blocks**: Catch executes only if deferred call returns an error
6. **Catch is diagnostic**: Catch blocks cannot alter function return values or control flow

## Best Practices

- Use defer for resource cleanup to ensure it always happens
- Keep defer statements close to resource acquisition for clarity
- Remember that defer executes at scope exit, not statement end
- Use defer with catch for logging cleanup errors, not for error recovery
- Catch blocks in defer are diagnostic-only and cannot change return values
- Avoid complex logic in defer - keep it simple and focused on cleanup
