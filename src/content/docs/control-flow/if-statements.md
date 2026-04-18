---
title: If Statements
description: Branching with if/else
sidebar:
  order: 1
---

```ferret
fn classify(score: i32) -> str {
    if score >= 90 {
        return "A"
    } else if score >= 80 {
        return "B"
    }
    return "C"
}
```

Use `if` as a statement for control flow. For multi-branch value selection, prefer `match`.
