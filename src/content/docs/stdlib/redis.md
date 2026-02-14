---
title: db/redis
description: Redis database client in Ferret
---

The `db/redis` module is a small Redis client built over `net/tcp`.

## Import

```ferret
import "db/redis";
```

## Type

```ferret
type Client struct {
    .conn: net::TcpConn
};
```

`Client` owns a TCP connection resource.
- Non-copyable by default
- Movable with `@`
- `Close()` consumes ownership (`@Client` receiver)

## API

```ferret
fn Connect(addr: str) -> str ! Client
fn (c: @Client) Close()

fn (c: &mut Client) CommandArgs(args: []str) -> str ! str
fn (c: &mut Client) CommandStr(args: ...str) -> str ! str
fn (c: &mut Client) CommandInt(args: ...str) -> str ! i64

fn (c: &mut Client) Ping() -> str ! str
fn (c: &mut Client) Get(key: str) -> str ! ?str
fn (c: &mut Client) Set(key: str, value: str) -> str ! bool
fn (c: &mut Client) Del(key: str) -> str ! i64
fn (c: &mut Client) Incr(key: str) -> str ! i64
fn (c: &mut Client) IncrBy(key: str, delta: i64) -> str ! i64
```

## Example

```ferret
import "db/redis";
import "std/io";

fn main() {
    let client := redis::Connect("127.0.0.1:6379") catch err {
        io::Println("connect error:", err);
        return;
    };
    defer client.Close();

    let ok := client.Set("counter", "10") catch err {
        io::Println("set error:", err);
        return;
    };

    if ok {
        let value := client.Get("counter") catch err {
            io::Println("get error:", err);
            return;
        };
        io::Println("counter:", value ?? "<none>");
    }

    let next := client.Incr("counter") catch err {
        io::Println("incr error:", err);
        return;
    };
    io::Println("counter after incr:", next);
}
```

## Ownership Example

```ferret
let c1 := redis::Connect("127.0.0.1:6379") catch err { return; };
// let c2 := c1; // ❌ implicit resource copy
let c2 := @c1;   // ✅ explicit move
c2.Close();
```
