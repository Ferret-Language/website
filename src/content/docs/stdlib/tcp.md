---
title: net/tcp
description: TCP networking in Ferret
---

The `net/tcp` module provides low-level TCP listener and connection primitives.

## Import

```ferret
import "net/tcp";
```

## Types

```ferret
type IpAddr struct {
    .Value: str
};

type SocketAddr struct {
    .Host: str,
    .Port: i32
};

type TcpListener struct {
    .handle: __tcp_listener,
    .addr: str
};

type TcpConn struct {
    .handle: __tcp_conn,
    .local: str,
    .remote: str
};
```

`TcpListener` and `TcpConn` are resource handles:
- Non-copyable by default
- Explicitly movable with `@`
- `Close()` consumes ownership (`@TcpListener`, `@TcpConn` receivers)

## API

```ferret
fn ListenTcp(addr: str) -> str ! TcpListener
fn DialTcp(addr: str) -> str ! TcpConn

fn (l: &mut TcpListener) Accept() -> str ! TcpConn
fn (l: @TcpListener) Close()

fn (c: &mut TcpConn) Read(maxBytes: i32) -> str ! []byte
fn (c: &mut TcpConn) ReadStr(maxBytes: i32) -> str ! str
fn (c: &mut TcpConn) Write(buf: []byte) -> str ! i32
fn (c: &mut TcpConn) WriteStr(data: str) -> str ! i32
fn (c: @TcpConn) Close()

fn (c: &mut TcpConn) SetReadTimeoutMs(ms: i32) -> str ! bool
fn (c: &mut TcpConn) SetWriteTimeoutMs(ms: i32) -> str ! bool
fn (c: &mut TcpConn) SetKeepAlive(enabled: bool) -> str ! bool
```

## Example: Echo Server

```ferret
import "net/tcp";
import "std/io";

fn handle(conn: &mut tcp::TcpConn) {
    let data := conn.Read(1024) catch err {
        io::Println("read error:", err);
        return;
    };

    conn.Write(data) catch err {
        io::Println("write error:", err);
    };
}

fn main() {
    let listener := tcp::ListenTcp("127.0.0.1:8080") catch err {
        io::Println("listen error:", err);
        return;
    };

    while true {
        let conn := listener.Accept() catch err {
            io::Println("accept error:", err);
            continue;
        };

        handle(&mut conn);
        conn.Close();
    }
}
```

## Ownership Example

```ferret
let c1 := tcp::DialTcp("127.0.0.1:8080") catch err { return; };
// let c2 := c1; // ❌ implicit resource copy
let c2 := @c1;   // ✅ explicit move
c2.Close();
```
