---
title: std/io
description: Streams, buffers, and text IO
sidebar:
  order: 2
---

`std/io` provides:

- `Writer` and `Reader` interfaces
- global streams `Stdin`, `Stdout`, `Stderr`
- `Buffer` for in-memory IO
- helpers `Write`, `Read`

```ferret
import "std/io"

fn main() {
    io::Write(io::Stdout, "hello\n") catch panic "write failed"
}
```
