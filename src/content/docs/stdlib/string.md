---
title: std/string
description: Owned mutable UTF-8 string type
sidebar:
  order: 8
---

`std/string::String` is an owned mutable UTF-8 buffer.

Key APIs:

- `string::New()`
- `string::FromStr(text)`
- `String::PushStr`, `Write`
- `String::Len`, `Capacity`, `IsEmpty`
- `String::AsStr`, `Bytes`
- `String::Release`

```ferret
import "std/string"

fn main() {
    let mut s = string::FromStr("hello")
    s.PushStr(" ferret")
    println(s.AsStr())
    s.Release()
}
```
