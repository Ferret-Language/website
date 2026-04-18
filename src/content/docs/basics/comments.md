---
title: Comments
description: Comment syntax in Ferret
sidebar:
  order: 4
---

Ferret supports single-line and block comments.

## Single-Line

```ferret
// Parse command-line args first.
let mode = "run"
```

## Block

```ferret
/*
Current limitation:
- only llvm backend is enabled in CLI commands
*/
fn main() {}
```

## Practical Rule

Use comments to explain intent or constraints, not obvious line-by-line behavior.
