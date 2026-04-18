---
title: Practical Patterns
description: Patterns that map well to current Ferret
sidebar:
  order: 5
---

## Keep Ownership Visible

Use `&T`/`&mut T` for APIs that borrow, and return plain values where possible.

## Keep Error Paths Explicit

Return `E!T` and handle with `catch` close to call sites.

## Keep Modules Small

Split runtime-facing code (IO/network/memory) from pure logic so testing stays simple.
