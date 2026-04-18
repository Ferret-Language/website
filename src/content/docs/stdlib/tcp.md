---
title: std/net/tcp
description: TCP dial/listen APIs
sidebar:
  order: 6
---

`std/net/tcp` provides `Conn` and `Listener`.

Main APIs:

- `tcp::Dial(host, port) -> io::Error!Conn`
- `tcp::Listen(host, port) -> io::Error!Listener`
- `Conn::Read`, `Conn::Write`, timeout setters, `Close`
- `Listener::Accept`, `SetAcceptTimeoutMs`, `Close`

```ferret
import "std/net/tcp"

fn main() {
    let mut listener = tcp::Listen("127.0.0.1", 8080) catch |err| {
        println(err)
        return
    }
    defer listener.Close()
}
```
