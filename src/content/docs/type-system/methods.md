---
title: Methods
description: Attached methods and receiver forms
sidebar:
  order: 5
---

Method declaration syntax:

```ferret
type Counter struct {
    value: i32 = 0
}

fn Counter::Read(&self) -> i32 {
    return self.value
}

fn Counter::Inc(&mut self) {
    self.value += 1
}
```

Static method form (no receiver):

```ferret
fn Counter::New() -> Counter {
    return .{}
}
```
