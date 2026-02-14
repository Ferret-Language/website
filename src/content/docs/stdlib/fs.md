---
title: "std/fs"
description: Filesystem operations in Ferret
---

The `std/fs` module provides file and directory operations.

## Import

```ferret
import "std/fs";
```

## Types

### FileInfo

```ferret
type FileInfo struct {
    .path: str,
    .size: i64,
    .isDir: bool,
    .isFile: bool,
    .exists: bool
};
```

### File

```ferret
type File struct {
    .handle: __file,
    .path: str,
    .mode: str
};
```

`File` is a resource handle type:
- Non-copyable by default (implicit copy is a compile error)
- Movable with `@file`
- `Close()` consumes ownership via move receiver

### FileMode

```ferret
type FileMode enum {
    Read,
    Write,
    Append,
    ReadWrite,
    CreateRW,
    AppendRead
};
```

### SeekWhence

```ferret
type SeekWhence enum {
    Start,
    Current,
    End
};
```

## Core API

```ferret
fn ReadFile(path: str) -> str ! str
fn WriteFile(path: str, content: str) -> str ! bool
fn AppendFile(path: str, content: str) -> str ! bool

fn Exists(path: str) -> bool
fn Stat(path: str) -> str ! FileInfo
fn Size(path: str) -> str ! i64

fn Open(path: str, mode: FileMode) -> str ! File
fn Create(path: str) -> str ! File
fn CreateRW(path: str) -> str ! File
fn OpenAppend(path: str) -> str ! File

fn (f: @File) Close()
fn (f: &mut File) ReadLine() -> str ! str
fn (f: &mut File) ReadBytes(maxBytes: i32) -> str ! []byte
fn (f: &mut File) Read(maxBytes: i32) -> str ! []byte
fn (f: &mut File) WriteStr(content: str) -> str ! bool
fn (f: &mut File) WriteLine(content: str) -> str ! bool
fn (f: &mut File) Write(buf: []byte) -> str ! i32
fn (f: &mut File) Seek(offset: i64, whence: SeekWhence) -> str ! i64
fn (f: &mut File) Rewind() -> str ! i64

fn Remove(path: str) -> str ! bool
fn Mkdir(path: str) -> str ! bool
fn Rmdir(path: str) -> str ! bool

fn Cwd() -> str ! str
fn Join(base: str, path: str) -> str
fn Ext(path: str) -> str
fn Base(path: str) -> str
fn Dir(path: str) -> str
```

## Example: Read/Write + Seek

```ferret
import "std/fs";
import "std/io";

fn main() {
    let file := fs::CreateRW("demo.txt") catch err {
        io::Println("create error:", err);
        return;
    };

    defer file.Close();

    file.WriteStr("Hello\nWorld\n") catch err {
        io::Println("write error:", err);
        return;
    };

    file.Rewind() catch err {
        io::Println("rewind error:", err);
        return;
    };

    let line1 := file.ReadLine() catch err {
        io::Println("read error:", err);
        return;
    };

    io::Println("first line:", line1);
}
```

## Ownership Notes

```ferret
let f1 := fs::Create("a.txt") catch err { return; };
// let f2 := f1; // ❌ resource values are non-copyable
let f2 := @f1;   // ✅ explicit move
f2.Close();
```
