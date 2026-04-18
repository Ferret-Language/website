---
title: Interfaces
description: Behavioral contracts for types
sidebar:
  order: 4
---

```ferret
type Stringer interface {
    String(self) -> str
}

type Name struct {
    value: i32 = 0
}

fn Name::String(self) -> str {
    return "name"
}
```

Receiver form is part of method identity (`self`, `&self`, `&mut self`, `*self`).
