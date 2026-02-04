---
title: time
description: Time and date utilities in Ferret
---

The `time` module provides functions for working with time, timestamps, and delays.

## Import

```ferret
import "time";
```

## Functions

### Now()
```ferret
fn Now() -> str
```
Returns the current time as a formatted string.

```ferret title="example"
import "time";
import "std/io";

let currentTime := time::Now();
io::Printf("Current time: {}\n", currentTime);
```

### NowUnix()
```ferret
fn NowUnix() -> i64
```
Returns the current Unix timestamp (seconds since January 1, 1970).

```ferret title="example"
import "time";
import "std/io";

let timestamp := time::NowUnix();
io::Printf("Unix timestamp: {}\n", timestamp);
```

### NowUnixMs()
```ferret
fn NowUnixMs() -> i64
```
Returns the current Unix timestamp in milliseconds.

```ferret title="example"
import "time";
import "std/io";

let timestampMs := time::NowUnixMs();
io::Printf("Unix timestamp (ms): {}\n", timestampMs);
```

### SinceUnixMs()
```ferret
fn SinceUnixMs(start: i64) -> i64
```
Returns the number of milliseconds elapsed since the given Unix timestamp in milliseconds.

## Date and Time Formatting

While the basic `time` module provides Unix timestamps, you can create helper functions for common formatting needs:

```ferret title="example"
import "time";
import "std/io";

fn formatDuration(ms: i64) -> str {
    if ms < 1000 {
        return (ms as str) + "ms";
    } else if ms < 60000 {
        let seconds := ms / 1000;
        let remainingMs := ms % 1000;
        return (seconds as str) + "." + (remainingMs as str) + "s";
    } else {
        let minutes := ms / 60000;
        let remainingMs := ms % 60000;
        let seconds := remainingMs / 1000;
        return (minutes as str) + "m " + (seconds as str) + "s";
    }
}

fn formatTimestamp(unixTimestamp: i64) -> str {
    // This would need actual date/time parsing in a real implementation
    // For now, just return the timestamp
    return "Timestamp: " + (unixTimestamp as str);
}

fn main() {
    let durations := [500, 1500, 65000, 125000];
    
    for duration in durations {
        io::Printf("{} ms = {}\n", duration, formatDuration(duration));
    }
    
    let now := time::NowUnix();
    io::Println(formatTimestamp(now));
}
```

## Best Practices

1. **Use appropriate time units** - Milliseconds for precise timing, seconds for longer intervals
2. **Handle time zones** when working with formatted times
3. **Account for leap seconds** in long-running applications
4. **Use monotonic time** for measuring durations (Unix timestamps can jump)
5. **Cache expensive time operations** when called frequently
6. **Validate time ranges** before performing operations
7. **Consider time drift** in long-running scheduled tasks

## Integration with Other Modules

The time module works well with other standard library modules:

- **File logging**: Timestamped log entries using `std/fs`
- **Network timeouts**: Timeout handling in network operations
- **Performance monitoring**: Timing database queries and API calls

## See Also

- [OS Module](/docs/stdlib/os) - OS process management
- [Filesystem](/docs/stdlib/fs) - File operations with timestamps
- [Error Handling](/docs/advanced/errors) - Handling timeout scenarios
