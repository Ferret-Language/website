---
title: os
description: Operating system interface in Ferret
---

The `os` module provides functions for interacting with the operating system, including process management, environment variables, and system information.

## Import

```ferret
import "os";
```

## Process Management

### Args()
```ferret
fn Args() -> []str
```
Returns the command-line arguments passed to the program (equivalent to `argv`).

```ferret title="example"
import "os";
import "std/io";

let args := os::Args();
io::Printf("Program: {}\n", args[0]);

for i in 1..len(&args) {
    let arg := at(&args, i);
    match arg {
        some(value) => io::Printf("Arg {}: {}\n", i, value),
        none => break
    }
}
```

### Exit()
```ferret
fn Exit(code: i32) -> void
```
Terminates the program with the specified exit code.

```ferret title="example"
import "os";
import "std/io";

if someCondition {
    io::Println("Error: Invalid configuration");
    os::Exit(1); // Exit with error code
}

io::Println("Success!");
os::Exit(0); // Exit successfully
```

### GetPid()
```ferret
fn GetPid() -> i32
```
Returns the current process ID.

```ferret title="example"
import "os";
import "std/io";

let pid := os::GetPid();
io::Printf("Current process ID: {}\n", pid);
```

### Sleep()
```ferret
fn Sleep(ms: i32) -> void
```
Pauses execution for the specified number of milliseconds.

```ferret title="example"
import "os";
import "std/io";

io::Println("Starting countdown...");
for i in 3..=1 {
    io::Printf("{}...\n", i);
    os::Sleep(1000); // Sleep for 1 second
}
io::Println("Go!");
```

### Exec()
```ferret
fn Exec(cmd: str) -> str ! i32
```
Executes a shell command and returns the exit code.

```ferret title="example"
import "os";
import "std/io";

let exitCode := os::Exec("ls -la") catch |err| {
    io::Printf("Command failed: {}\n", err);
    return;
};

io::Printf("Command exited with code: {}\n", exitCode);
```

### Kill()
```ferret
fn Kill(pid: i32, signal: i32) -> str ! bool
```
Sends a signal to the specified process.

```ferret title="example"
import "os";
import "std/io";

// Send SIGTERM to process
os::Kill(12345, os::SIGTERM) catch |err| {
    io::Printf("Failed to kill process: {}\n", err);
};

// Check if process exists (signal 0)
let exists := os::Kill(12345, 0) catch |err| {
    io::Println("Process does not exist");
    false
};

if exists {
    io::Println("Process is running");
}
```

### Signal()
```ferret
fn Signal(signal: i32) -> str ! bool
```
Sends a signal to the current process.

```ferret title="example"
import "os";
import "std/io";

// Self-terminate with SIGINT
os::Signal(os::SIGINT) catch |err| {
    io::Printf("Failed to send signal: {}\n", err);
};
```

## Environment Variables

### GetEnv()
```ferret
fn GetEnv(key: str) -> str ! str
```
Retrieves the value of an environment variable.

```ferret title="example"
import "os";
import "std/io";

let home := os::GetEnv("HOME") catch |err| {
    io::Printf("HOME not set: {}\n", err);
    "/tmp"
};

io::Printf("Home directory: {}\n", home);

// Check for custom environment variable
let apiKey := os::GetEnv("API_KEY") catch |err| {
    io::Println("Warning: API_KEY not set");
    ""
};
```

### SetEnv()
```ferret
fn SetEnv(key: str, value: str) -> str ! bool
```
Sets an environment variable.

```ferret title="example"
import "os";
import "std/io";

os::SetEnv("DEBUG", "true") catch |err| {
    io::Printf("Failed to set DEBUG: {}\n", err);
};

os::SetEnv("APP_VERSION", "1.2.3") catch |err| {
    io::Printf("Failed to set APP_VERSION: {}\n", err);
};
```

### UnsetEnv()
```ferret
fn UnsetEnv(key: str) -> str ! bool
```
Removes an environment variable.

```ferret title="example"
import "os";
import "std/io";

os::UnsetEnv("TEMP_VAR") catch |err| {
    io::Printf("Failed to unset TEMP_VAR: {}\n", err);
};
```

## System Information

### Hostname()
```ferret
fn Hostname() -> str ! str
```
Returns the hostname of the machine.

```ferret title="example"
import "os";
import "std/io";

let hostname := os::Hostname() catch |err| {
    io::Printf("Failed to get hostname: {}\n", err);
    "unknown"
};

io::Printf("Running on: {}\n", hostname);
```

### Cpus()
```ferret
fn Cpus() -> i32
```
Returns the number of logical CPU cores.

```ferret title="example"
import "os";
import "std/io";

let cpuCount := os::Cpus();
io::Printf("System has {} CPU cores\n", cpuCount);

// Adjust worker count based on CPU cores
let workers := if cpuCount > 4 { cpuCount - 1 } else { cpuCount };
io::Printf("Using {} workers\n", workers);
```

## Signal Constants

Common POSIX signals are available as constants:

```ferret
const SIGINT := 2;     // Interrupt (Ctrl+C)
const SIGILL := 4;     // Illegal instruction
const SIGABRT := 6;    // Abort
const SIGFPE := 8;     // Floating point exception
const SIGKILL := 9;    // Kill (cannot be caught)
const SIGSEGV := 11;   // Segmentation fault
const SIGPIPE := 13;   // Broken pipe
const SIGTERM := 15;   // Termination request
```

### Signal Usage Examples
```ferret title="example"
import "os";
import "std/io";

// Graceful shutdown
fn shutdown(pid: i32) {
    io::Printf("Sending SIGTERM to {}\n", pid);
    os::Kill(pid, os::SIGTERM) catch |err| {
        io::Printf("Failed to send SIGTERM: {}\n", err);
        return;
    };
    
    os::Sleep(5000); // Wait 5 seconds
    
    // Force kill if still running
    let stillRunning := os::Kill(pid, 0) catch |err| false;
    if stillRunning {
        io::Printf("Force killing {}\n", pid);
        os::Kill(pid, os::SIGKILL) catch |err| {
            io::Printf("Failed to force kill: {}\n", err);
        };
    }
}
```

## Practical Examples

### Environment Configuration
```ferret title="example"
import "os";
import "std/io";

type AppConfig struct {
    .debug: bool,
    .port: i32,
    .dbUrl: str
};

fn loadConfigFromEnv() -> AppConfig {
    let debug := match os::GetEnv("DEBUG") {
        ok(value) => value == "true" || value == "1",
        err(_) => false
    };
    
    let port := match os::GetEnv("PORT") {
        ok(value) => {
            // Parse port number (simplified)
            let parsed := 8080; // Default
            parsed
        },
        err(_) => 8080
    };
    
    let dbUrl := os::GetEnv("DATABASE_URL") catch |err| {
        io::Println("Warning: DATABASE_URL not set, using default");
        "sqlite:///app.db"
    };
    
    return AppConfig{
        .debug: debug,
        .port: port,
        .dbUrl: dbUrl
    };
}
```

### Process Monitor
```ferret title="example"
import "os";
import "std/io";

fn monitorProcess(pid: i32, intervalMs: i32) {
    io::Printf("Monitoring process {}\n", pid);
    
    while true {
        let isRunning := os::Kill(pid, 0) catch |err| false;
        
        if !isRunning {
            io::Printf("Process {} has terminated\n", pid);
            break;
        }
        
        io::Printf("Process {} is still running\n", pid);
        os::Sleep(intervalMs);
    }
}

fn main() {
    let args := os::Args();
    if len(&args) < 2 {
        io::Println("Usage: monitor <pid>");
        os::Exit(1);
    }
    
    // Parse PID from args (simplified)
    let pid := 12345; // Would parse from args[1]
    monitorProcess(pid, 5000); // Check every 5 seconds
}
```

### System Information Tool
```ferret title="example"
import "os";
import "std/io";

fn printSystemInfo() {
    io::Println("=== System Information ===");
    
    // Hostname
    let hostname := os::Hostname() catch |err| "unknown";
    io::Printf("Hostname: {}\n", hostname);
    
    // CPU count
    let cpus := os::Cpus();
    io::Printf("CPU Cores: {}\n", cpus);
    
    // Process info
    let pid := os::GetPid();
    io::Printf("Current PID: {}\n", pid);
    
    // Environment variables
    io::Println("\n=== Environment ===");
    let vars := ["PATH", "HOME", "USER", "SHELL"];
    for envVar in vars {
        let value := os::GetEnv(envVar) catch |err| "<not set>";
        io::Printf("{}: {}\n", envVar, value);
    }
    
    // Command line arguments
    io::Println("\n=== Arguments ===");
    let args := os::Args();
    for i in 0..len(&args) {
        let arg := at(&args, i);
        match arg {
            some(value) => io::Printf("[{}]: {}\n", i, value),
            none => {}
        }
    }
}
```

### Daemon Process
```ferret title="example"
import "os";
import "std/io";
import "std/fs";
import "time";

fn daemonize() {
    let pid := os::GetPid();
    io::Printf("Starting daemon (PID: {})\n", pid);
    
    // Write PID file
    let pidStr := pid as str;
    fs::WriteFile("/var/run/mydaemon.pid", pidStr) catch |err| {
        io::Printf("Warning: Cannot write PID file: {}\n", err);
    };
    
    // Main daemon loop
    let counter := 0;
    while true {
        counter += 1;
        
        // Do work
        let timestamp := time::Now();
        let logEntry := "[" + timestamp + "] Heartbeat " + (counter as str) + "\n";
        
        fs::AppendFile("/var/log/mydaemon.log", logEntry) catch |err| {
            io::Printf("Log error: {}\n", err);
        };
        
        // Sleep for 60 seconds
        os::Sleep(60000);
    }
}

fn stopDaemon() {
    let pidStr := fs::ReadFile("/var/run/mydaemon.pid") catch |err| {
        io::Printf("Cannot read PID file: {}\n", err);
        return;
    };
    
    // Parse PID (simplified)
    let pid := 0; // Would parse from pidStr
    
    os::Kill(pid, os::SIGTERM) catch |err| {
        io::Printf("Failed to stop daemon: {}\n", err);
    };
    
    // Clean up PID file
    fs::Remove("/var/run/mydaemon.pid") catch |err| {
        io::Printf("Cannot remove PID file: {}\n", err);
    };
}
```

## Best Practices

1. **Always handle errors** - System calls can fail in many ways
2. **Use appropriate exit codes** - 0 for success, non-zero for errors
3. **Check process existence** before sending signals (use signal 0)
4. **Handle missing environment variables** gracefully with defaults
5. **Use SIGTERM before SIGKILL** for graceful shutdowns
6. **Sleep appropriately** - Don't busy-wait, but don't sleep too long
7. **Validate command arguments** before using them

## Cross-Platform Notes

- **Signals**: Available on Unix/Linux/macOS, limited support on Windows
- **Environment variables**: Work on all platforms but may have different naming conventions
- **Process IDs**: Available everywhere but format may vary
- **Commands**: Shell commands are platform-specific (`ls` vs `dir`)

## See Also

- [Error Handling](/docs/advanced/errors) - Learn about Result types and error handling patterns
- [Filesystem Module](/docs/stdlib/fs) - File operations that complement OS functions
- [Time Module](/docs/stdlib/time) - Time-related utilities for logging and scheduling
