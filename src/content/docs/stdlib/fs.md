---
title: "std/fs"
description: Filesystem operations in Ferret
---

The `std/fs` module provides functions for reading, writing, and managing files and directories.

## Import

```ferret
import "std/fs";
```

## Types

### FileInfo
```ferret
type FileInfo struct {
    .path: str,      // Full path to file
    .size: i64,      // Size in bytes
    .isDir: bool,    // True if directory
    .isFile: bool,   // True if regular file
    .exists: bool    // True if file exists
};
```

### File
```ferret
type File struct {
    .handle: i64,    // Internal file handle
    .path: str,      // Path that was opened
    .mode: str       // Mode: "r", "w", "a"
};
```

## Simple File Operations

### ReadFile()
```ferret
fn ReadFile(path: str) -> str ! str
```
Reads the entire file as a string. Best for small to medium-sized text files.

```ferret title="example"
import "std/fs";
import "std/io";

let content := fs::ReadFile("config.txt") catch |err| {
    io::Println("Failed to read file:", err);
    return;
};

io::Println("File content:", content);
```

### WriteFile()
```ferret
fn WriteFile(path: str, content: str) -> str ! bool
```
Writes a string to a file, creating or overwriting it.

```ferret title="example"
import "std/fs";
import "std/io";

let data := "Hello, World!\nThis is a test.";
fs::WriteFile("output.txt", data) catch |err| {
    io::Println("Failed to write file:", err);
    return;
};

io::Println("File written successfully!");
```

### AppendFile()
```ferret
fn AppendFile(path: str, content: str) -> str ! bool
```
Appends a string to the end of a file.

```ferret title="example"
import "std/fs";
import "std/io";
import "time";

let timestamp := time::Now();
let logEntry := "[" + timestamp + "] User logged in\n";

fs::AppendFile("app.log", logEntry) catch |err| {
    io::Println("Failed to write to log:", err);
};
```

## File Information

### Exists()
```ferret
fn Exists(path: str) -> bool
```
Checks if a file or directory exists.

```ferret title="example"
import "std/fs";
import "std/io";

if fs::Exists("config.json") {
    io::Println("Config file found");
} else {
    io::Println("Config file not found");
}
```

### Stat()
```ferret
fn Stat(path: str) -> str ! FileInfo
```
Returns detailed information about a file or directory.

```ferret title="example"
import "std/fs";
import "std/io";

let info := fs::Stat("data.bin") catch |err| {
    io::Println("Cannot stat file:", err);
    return;
};

io::Printf("Path: {}\n", info.path);
io::Printf("Size: {} bytes\n", info.size);
io::Printf("Is directory: {}\n", info.isDir);
io::Printf("Is file: {}\n", info.isFile);
```

### Size()
```ferret
fn Size(path: str) -> str ! i64
```
Returns the size of a file in bytes (convenience wrapper for `Stat()`).

```ferret title="example"
import "std/fs";
import "std/io";

let fileSize := fs::Size("video.mp4") catch |err| {
    io::Println("Cannot get file size:", err);
    return;
};

if fileSize > 1024 * 1024 * 100 { // 100 MB
    io::Println("Large file detected!");
}
```

## File Handle Operations

For large files or when you need more control, use file handles:

### Open()
```ferret
fn Open(path: str) -> str ! File
```
Opens a file for reading.

```ferret title="example"
import "std/fs";
import "std/io";

let file := fs::Open("large_data.txt") catch |err| {
    io::Println("Cannot open file:", err);
    return;
};
defer fs::Close(file);

// Read line by line
while true {
    let line := fs::ReadLine(file) catch |err| {
        break; // End of file or error
    };
    
    io::Println("Line:", line);
}
```

### Create()
```ferret
fn Create(path: str) -> str ! File
```
Creates a new file for writing (truncates if exists).

```ferret title="example"
import "std/fs";
import "std/io";

let file := fs::Create("report.txt") catch |err| {
    io::Println("Cannot create file:", err);
    return;
};
defer fs::Close(file);

fs::WriteLine(file, "=== Report ===") catch |err| {
    io::Println("Write error:", err);
};

fs::WriteLine(file, "Status: OK") catch |err| {
    io::Println("Write error:", err);
};
```

### OpenAppend()
```ferret
fn OpenAppend(path: str) -> str ! File
```
Opens a file for appending (creates if doesn't exist).

```ferret title="example"
import "std/fs";
import "std/io";

let logFile := fs::OpenAppend("debug.log") catch |err| {
    io::Println("Cannot open log file:", err);
    return;
};
defer fs::Close(logFile);

fs::WriteLine(logFile, "[DEBUG] Application started") catch |err| {
    io::Println("Log write error:", err);
};
```

### Close()
```ferret
fn Close(file: File)
```
Closes a file handle. Always call this when done with a file handle.

### ReadLine()
```ferret
fn ReadLine(file: File) -> str ! str
```
Reads a single line from a file handle.

### Write()
```ferret
fn Write(file: File, content: str) -> str ! bool
```
Writes a string to a file handle without adding a newline.

### WriteLine()
```ferret
fn WriteLine(file: File, content: str) -> str ! bool
```
Writes a string to a file handle with a trailing newline.

## Directory Operations

### Remove()
```ferret
fn Remove(path: str) -> str ! bool
```
Deletes a file.

```ferret title="example"
import "std/fs";
import "std/io";

fs::Remove("temp_file.txt") catch |err| {
    io::Println("Failed to delete file:", err);
};
```

## Practical Examples

### Configuration File Manager
```ferret title="example"
import "std/fs";
import "std/io";

type Config struct {
    .appName: str,
    .version: str,
    .debug: bool
};

fn loadConfig(path: str) -> str ! Config {
    if !fs::Exists(path) {
        return Config{.appName: "MyApp", .version: "1.0", .debug: false};
    }
    
    let content := fs::ReadFile(path) catch |err| err;
    // Parse JSON-like format (simplified)
    // ... parsing logic ...
    
    return Config{.appName: "Loaded", .version: "2.0", .debug: true};
}

fn saveConfig(path: str, config: Config) -> str ! bool {
    let content := "appName: " + config.appName + "\n" +
                   "version: " + config.version + "\n" +
                   "debug: " + (if config.debug { "true" } else { "false" }) + "\n";
    
    fs::WriteFile(path, content) catch |err| err;
    return true;
}
```

### Log File Processor
```ferret title="example"
import "std/fs";
import "std/io";

fn processLogFile(inputPath: str, outputPath: str) -> str ! bool {
    let inputFile := fs::Open(inputPath) catch |err| err;
    defer fs::Close(inputFile);
    
    let outputFile := fs::Create(outputPath) catch |err| err;
    defer fs::Close(outputFile);
    
    let errorCount := 0;
    let lineNum := 1;
    
    while true {
        let line := fs::ReadLine(inputFile) catch |err| {
            break; // End of file
        };
        
        // Process line
        let chars := line as []char;
        if len(&chars) > 0 {
            let lineStr := line as str;
            if lineStr.contains("ERROR") {
                errorCount += 1;
                let errorLine := "Line " + (lineNum as str) + ": " + line + "\n";
                fs::Write(outputFile, errorLine) catch |err| {
                    io::Println("Write error:", err);
                };
            }
        }
        
        lineNum += 1;
    }
    
    let summary := "\n--- Summary ---\n" +
                   "Total errors found: " + (errorCount as str) + "\n" +
                   "Total lines processed: " + (lineNum as str) + "\n";
    fs::Write(outputFile, summary) catch |err| {
        io::Println("Summary write error:", err);
    };
    
    return true;
}
```

### File Backup System
```ferret title="example"
import "std/fs";
import "std/io";
import "time";

fn backupFile(sourcePath: str) -> str ! str {
    if !fs::Exists(sourcePath) {
        return "Source file does not exist";
    }
    
    let timestamp := time::Now();
    let backupPath := sourcePath + ".backup." + timestamp;
    
    // Read original file
    let content := fs::ReadFile(sourcePath) catch |err| err;
    
    // Write backup
    fs::WriteFile(backupPath, content) catch |err| {
        return "Failed to create backup: " + err;
    };
    
    io::Printf("Backup created: {}\n", backupPath);
    return backupPath;
}

fn restoreFromBackup(backupPath: str, targetPath: str) -> str ! bool {
    let content := fs::ReadFile(backupPath) catch |err| err;
    fs::WriteFile(targetPath, content) catch |err| err;
    
    io::Printf("Restored {} from {}\n", targetPath, backupPath);
    return true;
}
```

## Error Handling Patterns

### Graceful Degradation
```ferret title="example"
import "std/fs";
import "std/io";

fn readConfigWithDefaults(configPath: str) -> Config {
    let config := match fs::ReadFile(configPath) {
        ok(content) => parseConfig(content),
        err(msg) => {
            io::Printf("Warning: Cannot read config ({}), using defaults\n", msg);
            getDefaultConfig()
        }
    };
    return config;
}
```

### Error Propagation
```ferret title="example"
import "std/fs";

fn processFiles(inputDir: str) -> str ! []str {
    let results := []str{};
    
    let files := getFileList(inputDir) catch |err| err;
    
    for file in files {
        let content := fs::ReadFile(file) catch |err| {
            return "Failed to read " + file + ": " + err;
        };
        
        let processed := processContent(content);
        append(&mut results, processed);
    }
    
    return results;
}
```

## Best Practices

1. **Always use `defer` with file handles** - Ensures files are closed even if errors occur
2. **Check if files exist** before operations when appropriate
3. **Handle all error cases** - File operations frequently fail
4. **Use `ReadFile()` for small files** - Simpler than handle operations
5. **Use file handles for large files** - More memory efficient
6. **Validate file sizes** before reading large files
7. **Create backups** before modifying important files

## See Also

- [Error Handling](/docs/advanced/errors) - Learn about Result types and error handling patterns
- [Defer Statements](/docs/control-flow/defer) - Automatic cleanup with defer
- [I/O Module](/docs/stdlib/io) - Console input/output operations
