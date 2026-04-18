---
title: Structs
description: Defining product types with named fields
sidebar:
  order: 1
---

```ferret
type User struct {
    Name: str
    age: i32 = 0
}
```

Construct values with composite literals:

```ferret
let u: User = .{ .Name = "Alex", .age = 22 }
let v = .User{ .Name = "Sam" }
```

Field visibility follows naming:

- uppercase field: public outside module
- lowercase field: module-private
