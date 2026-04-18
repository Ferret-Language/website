---
title: std/net/http
description: HTTP request/response helpers and server surface
sidebar:
  order: 7
---

`std/net/http` currently includes:

- request and response models
- response writer utilities
- single-request server flow (`ServeOnce`)
- route handling on `Server`

Example handler signature:

```ferret
fn Handle(req: &http::Request, res: &mut http::ResponseWriter) -> io::Error!usize
```

The current module is geared toward lightweight runtime-backed HTTP paths and is still evolving.
