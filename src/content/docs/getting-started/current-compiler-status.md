---
title: Current Compiler Status
description: What is stable in the new Ferret compiler and what is still migrating
sidebar:
  order: 0
---

This page tracks the current documentation baseline for the new Ferret compiler.

## What Changed

The old compiler and syntax examples were significantly different. The current compiler line uses:

- `.ferr` source files
- `run` / `check` style CLI workflows
- explicit ownership pointer forms (`*T`, `*mut T`, `*own T`, `*raw T`)
- import/member access with `::`
- backend selection targeting LLVM or QBE

## Stable Syntax Baseline

Use this as the reliable baseline while deeper docs continue migration:

```ferret
import "std/io"

type Mode enum {
    debug,
    run,
}

fn main() i32 {
    let mode = Mode::run
    if mode == Mode::run {
        io::Println("hello from current Ferret")
    }
    return 0
}
```

## Build and Run Baseline

```bash
# from compiler/
./build.sh
./output/ferret/bin/ferret run main.ferr
```

## About the Playground

The playground uses a WebAssembly compiler build in-browser.

The next step is closer feature parity with local workflows by compiling and integrating more of the full compiler toolchain path for browser use.

## Migration Note

Some advanced pages still contain legacy examples. If an example conflicts with this page, prefer this page and the `Getting Started` section.
