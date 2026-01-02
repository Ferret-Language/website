---
title: File System
description: Learn how to work with files and directories using the std/fs module
sidebar:
  order: 3
---

The `std/fs` module provides comprehensive file system operations for reading, writing, and managing files and directories in Ferret.

## Import

```ferret
import "std/fs";
```

## Simple File Operations

### Reading Files

```ferret
fs::ReadFile(path: str) -> str ! str;
```

Reads the entire contents of a file as a string. This is the simplest way to read a file.

```ferret
import "std/fs";
import "std/io";

fn main() {
    let content := fs::ReadFile("config.txt") catch err {
        io::Println("Error: ", err);
        return;
    };
    io::Println("File contents:\n", content);
}
```

**Returns:** Result type containing either the file contents as a string or an error message.

### Writing Files

```ferret
fs::WriteFile(path: str, content: str) -> str ! bool;
```

Writes a string to a file, creating it if it doesn't exist or overwriting it if it does.

```ferret
fs::WriteFile("output.txt", "Hello, World!") catch err {
    io::Println("Failed to write: ", err);
    return;
};
io::Println("File written successfully");
```

**Returns:** Result type containing `true` on success or an error message on failure.

```ferret
fs::AppendFile(path: str, content: str) -> str ! bool;
```

Appends content to the end of an existing file without overwriting it.

```ferret
fs::AppendFile("log.txt", "New log entry\n") catch err {
    io::Println("Failed to append: ", err);
};
```

**Returns:** Result type containing `true` on success or an error message on failure.

## File Information

```ferret
fs::Exists(path: str) -> bool;
```

Checks if a file or directory exists at the given path.

```ferret
if fs::Exists("config.json") {
    io::Println("Config file found");
} else {
    io::Println("Config file not found, using defaults");
}
```

**Returns:** `true` if the path exists, `false` otherwise.

```ferret
fs::Stat(path: str) -> str ! FileInfo;
```

Gets detailed information about a file or directory.

```ferret
let info := fs::Stat("myfile.txt") catch err {
    io::Println("Error: ", err);
    return;
};

io::Println("Path: ", info.Path);
io::Println("Size: ", info.Size, " bytes");
io::Println("Is directory: ", info.IsDir);
io::Println("Is file: ", info.IsFile);
io::Println("Exists: ", info.Exists);
```

**Returns:** Result type containing a `FileInfo` struct with:
- `.Path: str` - Full path to the file
- `.Size: i64` - Size in bytes
- `.IsDir: bool` - True if it's a directory
- `.IsFile: bool` - True if it's a regular file
- `.Exists: bool` - True if the file exists

```ferret
fs::Size(path: str) -> str ! i64;
```

Returns the size of a file in bytes (convenience wrapper for `Stat`).

```ferret
let size := fs::Size("large_file.bin") catch err {
    io::Println("Error: ", err);
    return;
};
io::Println("File size: ", size, " bytes");
```

**Returns:** Result type containing the file size in bytes or an error message.

## File Handle Operations

For working with large files or reading line-by-line, use file handles instead of loading the entire file into memory.

### Opening Files

```ferret
fs::Open(path: str) -> str ! File;
```

Opens a file for reading.

```ferret
let file := fs::Open("data.txt") catch err {
    io::Println("Error opening file: ", err);
    return;
};
// Use file...
fs::Close(file);
```

**Returns:** Result type containing a `File` handle or an error message.

The `File` struct contains:
- `.Handle: i64` - Internal file handle
- `.Path: str` - Path that was opened
- `.Mode: str` - Mode: "r", "w", or "a"

```ferret
fs::Create(path: str) -> str ! File;
```

Creates a new file for writing, or truncates it if it exists.

```ferret
let file := fs::Create("output.txt") catch err {
    io::Println("Error creating file: ", err);
    return;
};
// Write to file...
fs::Close(file);
```

**Returns:** Result type containing a `File` handle or an error message.

```ferret
fs::OpenAppend(path: str) -> str ! File;
```

Opens a file for appending (writing to the end).

```ferret
let file := fs::OpenAppend("log.txt") catch err {
    io::Println("Error opening file: ", err);
    return;
};
// Append to file...
fs::Close(file);
```

**Returns:** Result type containing a `File` handle or an error message.

### Working with File Handles

```ferret
fs::Close(file: File);
```

Closes a file handle. Always close files when done to free resources.

```ferret
let file := fs::Open("data.txt") catch err { return; };
// ... use file ...
fs::Close(file);
```

```ferret
fs::ReadLine(file: File) -> str ! str;
```

Reads one line from a file (up to and including the newline character).

```ferret
let file := fs::Open("data.txt") catch err { return; };

while true {
    let line := fs::ReadLine(file) catch err {
        break;  // End of file or error
    };
    io::Println("Line: ", line);
}

fs::Close(file);
```

**Returns:** Result type containing the line as a string or an error message.

```ferret
fs::Write(file: File, content: str) -> str ! bool;
```

Writes a string to a file handle.

```ferret
let file := fs::Create("output.txt") catch err { return; };

fs::Write(file, "Hello, ") catch err {
    fs::Close(file);
    return;
};
fs::Write(file, "World!") catch err {
    fs::Close(file);
    return;
};

fs::Close(file);
```

**Returns:** Result type containing `true` on success or an error message.

```ferret
fs::WriteLine(file: File, content: str) -> str ! bool;
```

Writes a string followed by a newline to a file handle.

```ferret
let file := fs::Create("log.txt") catch err { return; };

fs::WriteLine(file, "First line") catch err {
    fs::Close(file);
    return;
};
fs::WriteLine(file, "Second line") catch err {
    fs::Close(file);
    return;
};

fs::Close(file);
```

**Returns:** Result type containing `true` on success or an error message.

## Directory Operations

```ferret
fs::Remove(path: str) -> str ! bool;
```

Deletes a file.

```ferret
fs::Remove("temp.txt") catch err {
    io::Println("Failed to remove file: ", err);
};
```

**Returns:** Result type containing `true` on success or an error message.

```ferret
fs::Mkdir(path: str) -> str ! bool;
```

Creates a new directory. Fails if parent directories don't exist.

```ferret
fs::Mkdir("new_folder") catch err {
    io::Println("Failed to create directory: ", err);
};
```

**Returns:** Result type containing `true` on success or an error message.

```ferret
fs::Rmdir(path: str) -> str ! bool;
```

Removes an empty directory. Fails if the directory is not empty.

```ferret
fs::Rmdir("empty_folder") catch err {
    io::Println("Failed to remove directory: ", err);
};
```

**Returns:** Result type containing `true` on success or an error message.

## Path Utilities

```ferret
fs::Cwd() -> str ! str;
```

Gets the current working directory.

```ferret
let cwd := fs::Cwd() catch err {
    io::Println("Error getting cwd: ", err);
    return;
};
io::Println("Current directory: ", cwd);
```

**Returns:** Result type containing the current working directory path or an error message.

```ferret
fs::Join(base: str, path: str) -> str;
```

Joins two path components with the appropriate separator.

```ferret
let path := fs::Join("folder", "file.txt");  // -> "folder/file.txt"
let nested := fs::Join(fs::Join("a", "b"), "c.txt");  // -> "a/b/c.txt"
```

**Returns:** The joined path as a string.

```ferret
fs::Ext(path: str) -> str;
```

Gets the file extension (including the dot).

```ferret
let ext := fs::Ext("file.txt");      // -> ".txt"
let ext2 := fs::Ext("archive.tar.gz"); // -> ".gz"
let ext3 := fs::Ext("noext");         // -> ""
```

**Returns:** The file extension as a string.

```ferret
fs::Base(path: str) -> str;
```

Gets the base name (filename without directory).

```ferret
let name := fs::Base("/path/to/file.txt");  // -> "file.txt"
let name2 := fs::Base("file.txt");          // -> "file.txt"
```

**Returns:** The base filename as a string.

```ferret
fs::Dir(path: str) -> str;
```

Gets the directory part of a path.

```ferret
let dir := fs::Dir("/path/to/file.txt");  // -> "/path/to"
let dir2 := fs::Dir("file.txt");          // -> "."
```

**Returns:** The directory path as a string.

## Practical Examples

### Reading Configuration File

```ferret
import "std/fs";
import "std/io";

fn load_config() -> str? {
    let content := fs::ReadFile("config.txt") catch err {
        io::Println("Config not found, using defaults");
        return none;
    };
    return content;
}
```

### Creating Log Files

```ferret
import "std/fs";
import "std/io";

fn log_message(message: str) {
    let timestamp := "2026-01-02 15:30:45";  // In real code, get actual time
    let entry := timestamp + " - " + message + "\n";
    
    fs::AppendFile("app.log", entry) catch err {
        io::Println("Failed to write log: ", err);
    };
}
```

### Processing Large Files Line-by-Line

```ferret
import "std/fs";
import "std/io";

fn process_large_file(path: str) {
    let file := fs::Open(path) catch err {
        io::Println("Error opening file: ", err);
        return;
    };
    
    let line_count := 0;
    while true {
        let line := fs::ReadLine(file) catch err {
            break;  // End of file
        };
        
        // Process line
        line_count = line_count + 1;
    }
    
    fs::Close(file);
    io::Println("Processed ", line_count, " lines");
}
```

### Safe File Operations

```ferret
import "std/fs";
import "std/io";

fn safe_write(path: str, content: str) -> bool {
    // Check if file exists
    if fs::Exists(path) {
        io::Println("Warning: File already exists!");
        return false;
    }
    
    // Write the file
    fs::WriteFile(path, content) catch err {
        io::Println("Write failed: ", err);
        return false;
    };
    
    // Verify it was written
    if !fs::Exists(path) {
        io::Println("File creation failed!");
        return false;
    }
    
    return true;
}
```

## Error Handling

All file operations that can fail return a Result type (`str ! T`). Always use `catch` blocks to handle potential errors:

```ferret
// Good: Handle errors
let content := fs::ReadFile("data.txt") catch err {
    io::Println("Error: ", err);
    return;
};

// Bad: Unwrapping without error handling (will panic if file doesn't exist)
// let content := fs::ReadFile("data.txt")!;
```

## Platform Compatibility

All file system operations in `std/fs` work consistently across different operating systems (Linux, macOS, Windows). The underlying implementation handles platform-specific differences automatically.

Path separators use forward slashes `/` on all platforms - the runtime converts them to the appropriate platform-specific separator when needed.

## See Also

- [Error Handling](/docs/advanced/errors) - Learn about Result types and error handling patterns
- [Built-in Functions](/docs/advanced/builtins) - Other built-in functions like `len()` and `append()`
- [Modules](/docs/advanced/modules) - How to import and use modules in Ferret
