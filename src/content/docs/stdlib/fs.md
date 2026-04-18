---
title: std/fs
description: File open/write/close APIs
sidebar:
  order: 3
---

`std/fs` currently exposes writable files.

```ferret
import "std/fs"
import "std/io"

fn main() {
    let mut file = fs::Open("app.log")
    defer file.Close()

    io::Write(file, "started\n") catch panic "write failed"
}
```
