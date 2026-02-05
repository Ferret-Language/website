---
title: db/redis
description: Redis database client in Ferret
---

The `db/redis` module provides a Redis client implementation for connecting to Redis databases and executing commands.

## Import

```ferret
import "db/redis";
```

## Types

### Client
```ferret
type Client struct {
    .conn: net::TcpConn
};
```
Represents a connection to a Redis server.

## Connection Management

### Connect()
```ferret
fn Connect(addr: str) -> str ! Client
```
Establishes a connection to a Redis server.

```ferret title="example"
import "db/redis";
import "std/io";

let client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Failed to connect to Redis: %s\n", err);
    return;
};

defer client.Close();

io::Println("Connected to Redis successfully!");
```

### Close()
```ferret
fn (c: &mut Client) Close()
```
Closes the Redis connection.

```ferret title="example"
import "db/redis";
import "std/io";

fn main() {
    let mut client := redis::Connect("localhost:6379") catch |err| {
        io::Printf("Connection error: %s\n", err);
        return;
    };
    
    // Always close the connection when done
    defer client.Close();
    
    // Use client...
}
```

## Basic Commands

### String Operations

#### Set()
```ferret
fn (c: &mut Client) Set(key: str, value: str) -> str ! str
```
Sets a key-value pair in Redis.

```ferret title="example"
import "db/redis";
import "std/io";

let mut client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Connection failed: %s\n", err);
    return;
};

defer client.Close();

// Set a string value
client.Set("user:1000:name", "Alice") catch |err| {
    io::Printf("SET failed: %s\n", err);
    return;
};

client.Set("user:1000:email", "alice@example.com") catch |err| {
    io::Printf("SET failed: %s\n", err);
    return;
};

io::Println("Values set successfully");
```

#### Get()
```ferret
fn (c: &mut Client) Get(key: str) -> str ! str
```
Retrieves the value of a key from Redis.

```ferret title="example"
import "db/redis";
import "std/io";

let mut client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Connection failed: %s\n", err);
    return;
};

defer client.Close();

// Get a value
let name := client.Get("user:1000:name") catch |err| {
    io::Printf("GET failed: %s\n", err);
    return;
};

io::Printf("User name: %s\n", name);

let email := client.Get("user:1000:email") catch |err| {
    io::Printf("GET failed: %s\n", err);
    return;
};

io::Printf("User email: %s\n", email);
```

#### Del()
```ferret
fn (c: &mut Client) Del(keys: []str) -> str ! i32
```
Deletes one or more keys from Redis.

```ferret title="example"
import "db/redis";
import "std/io";

let mut client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Connection failed: %s\n", err);
    return;
};

defer client.Close();

// Delete single key
let deletedCount := client.Del(["user:1000:temp"]) catch |err| {
    io::Printf("DEL failed: %s\n", err);
    return;
};

io::Printf("Deleted %d keys\n", deletedCount);

// Delete multiple keys
let keysToDelete := ["user:1000:session", "user:1000:cache"];
let deleted := client.Del(keysToDelete) catch |err| {
    io::Printf("DEL failed: %s\n", err);
    return;
};

io::Printf("Deleted %d keys\n", deleted);
```

#### Exists()
```ferret
fn (c: &mut Client) Exists(keys: []str) -> str ! i32
```
Checks if one or more keys exist in Redis.

```ferret title="example"
import "db/redis";
import "std/io";

let mut client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Connection failed: %s\n", err);
    return;
};

defer client.Close();

let existsCount := client.Exists(["user:1000:name", "user:1000:email"]) catch |err| {
    io::Printf("EXISTS failed: %s\n", err);
    return;
};

io::Printf("%d keys exist\n", existsCount);
```

### List Operations

#### LPush()
```ferret
fn (c: &mut Client) LPush(key: str, values: []str) -> str ! i32
```
Prepends values to the head of a list.

#### RPush()
```ferret
fn (c: &mut Client) RPush(key: str, values: []str) -> str ! i32
```
Appends values to the tail of a list.

#### LPop()
```ferret
fn (c: &mut Client) LPop(key: str) -> str ! str
```
Removes and returns the first element from a list.

#### RPop()
```ferret
fn (c: &mut Client) RPop(key: str) -> str ! str
```
Removes and returns the last element from a list.

#### LLen()
```ferret
fn (c: &mut Client) LLen(key: str) -> str ! i32
```
Returns the length of a list.

```ferret title="example"
import "db/redis";
import "std/io";

let mut client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Connection failed: %s\n", err);
    return;
};

defer client.Close();

// Working with lists
let listKey := "tasks";

// Add items to list
let length := client.RPush(listKey, ["task1", "task2", "task3"]) catch |err| {
    io::Printf("RPUSH failed: %s\n", err);
    return;
};

io::Printf("List length after RPUSH: %d\n", length);

// Get list length
let currentLength := client.LLen(listKey) catch |err| {
    io::Printf("LLEN failed: %s\n", err);
    return;
};

io::Printf("Current list length: %d\n", currentLength);

// Pop items
while true {
    let item := client.LPop(listKey) catch |err| {
        io::Println("No more items in list");
        break;
    };
    
    io::Printf("Processing task: %s\n", item);
}
```

### Hash Operations

#### HSet()
```ferret
fn (c: &mut Client) HSet(key: str, fields: map[str]str) -> str ! i32
```
Sets fields in a hash.

#### HGet()
```ferret
fn (c: &mut Client) HGet(key: str, field: str) -> str ! str
```
Gets a field value from a hash.

#### HGetAll()
```ferret
fn (c: &mut Client) HGetAll(key: str) -> str ! map[str]str
```
Gets all fields and values from a hash.

#### HDel()
```ferret
fn (c: &mut Client) HDel(key: str, fields: []str) -> str ! i32
```
Deletes fields from a hash.

```ferret title="example"
import "db/redis";
import "std/io";

let mut client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Connection failed: %s\n", err);
    return;
};

defer client.Close();

let userKey := "user:1001";

// Set hash fields
let userFields := map[str]str{
    "name": "Bob",
    "email": "bob@example.com",
    "age": "30",
    "city": "New York"
};

let fieldsSet := client.HSet(userKey, userFields) catch |err| {
    io::Printf("HSET failed: %s\n", err);
    return;
};

io::Printf("Set %d fields in hash\n", fieldsSet);

// Get individual field
let name := client.HGet(userKey, "name") catch |err| {
    io::Printf("HGET failed: %s\n", err);
    return;
};

io::Printf("User name: %s\n", name);

// Get all fields
let allFields := client.HGetAll(userKey) catch |err| {
    io::Printf("HGETALL failed: %s\n", err);
    return;
};

io::Println("All user fields:");
// Note: In actual implementation, you'd iterate over the map
// for (field, value) in allFields {
//     io::Printf("  %s: %s\n", field, value);
// }
```

### Set Operations

#### SAdd()
```ferret
fn (c: &mut Client) SAdd(key: str, members: []str) -> str ! i32
```
Adds members to a set.

#### SMembers()
```ferret
fn (c: &mut Client) SMembers(key: str) -> str ! []str
```
Returns all members of a set.

#### SIsMember()
```ferret
fn (c: &mut Client) SIsMember(key: str, member: str) -> str ! bool
```
Checks if a member exists in a set.

#### SRem()
```ferret
fn (c: &mut Client) SRem(key: str, members: []str) -> str ! i32
```
Removes members from a set.

```ferret title="example"
import "db/redis";
import "std/io";

let mut client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Connection failed: %s\n", err);
    return;
};

defer client.Close();

let tagsKey := "article:1:tags";

// Add tags to set
let added := client.SAdd(tagsKey, ["redis", "database", "nosql", "cache"]) catch |err| {
    io::Printf("SADD failed: %s\n", err);
    return;
};

io::Printf("Added %d tags\n", added);

// Check if member exists
let exists := client.SIsMember(tagsKey, "redis") catch |err| {
    io::Printf("SISMEMBER failed: %s\n", err);
    return;
};

if exists {
    io::Println("Article is tagged with 'redis'");
} else {
    io::Println("Article is not tagged with 'redis'");
}

// Get all members
let allTags := client.SMembers(tagsKey) catch |err| {
    io::Printf("SMEMBERS failed: %s\n", err);
    return;
};

io::Println("All tags:");
for tag in allTags {
    io::Printf("  - %s\n", tag);
}
```

### Key Expiration

#### Expire()
```ferret
fn (c: &mut Client) Expire(key: str, seconds: i32) -> str ! bool
```
Sets a timeout on a key (in seconds).

#### TTL()
```ferret
fn (c: &mut Client) TTL(key: str) -> str ! i32
```
Returns the remaining time to live of a key.

```ferret title="example"
import "db/redis";
import "std/io";
import "time";

let mut client := redis::Connect("127.0.0.1:6379") catch |err| {
    io::Printf("Connection failed: %s\n", err);
    return;
};

defer client.Close();

let sessionKey := "session:abc123";

// Set session data
client.Set(sessionKey, "user_id:1001") catch |err| {
    io::Printf("SET failed: %s\n", err);
    return;
};

// Set expiration to 30 minutes (1800 seconds)
let expired := client.Expire(sessionKey, 1800) catch |err| {
    io::Printf("EXPIRE failed: %s\n", err);
    return;
};

if expired {
    io::Println("Session expiration set successfully");
} else {
    io::Println("Failed to set expiration");
}

// Check remaining TTL
let ttl := client.TTL(sessionKey) catch |err| {
    io::Printf("TTL failed: %s\n", err);
    return;
};

io::Printf("Session expires in %d seconds\n", ttl);
```

## Practical Examples

### User Session Management
```ferret title="example"
import "db/redis";
import "std/io";
import "time";

type SessionManager struct {
    .client: redis::Client,
    .prefix: str,
    .defaultTTL: i32
};

fn newSessionManager(redisAddr: str, prefix: str) -> str ! SessionManager {
    let client := redis::Connect(redisAddr) catch |err| err;
    
    return SessionManager{
        .client: client,
        .prefix: prefix,
        .defaultTTL: 3600  // 1 hour default
    };
}

fn (sm: &mut SessionManager) close() {
    sm.client.Close();
}

fn (sm: &mut SessionManager) createSession(userId: str) -> str ! str {
    let sessionId := "sess_" + (time::NowUnixMs() as str);
    let sessionKey := sm.prefix + ":" + sessionId;
    
    // Store session data as hash
    let sessionData := map[str]str{
        "user_id": userId,
        "created": time::Now(),
        "last_access": time::Now()
    };
    
    sm.client.HSet(sessionKey, sessionData) catch |err| err;
    sm.client.Expire(sessionKey, sm.defaultTTL) catch |err| err;
    
    return sessionId;
}

fn (sm: &mut SessionManager) getSession(sessionId: str) -> str ! map[str]str {
    let sessionKey := sm.prefix + ":" + sessionId;
    
    let sessionData := sm.client.HGetAll(sessionKey) catch |err| err;
    
    // Update last access time
    let accessData := map[str]str{"last_access": time::Now()};
    sm.client.HSet(sessionKey, accessData) catch |err| {
        // Non-fatal error, continue
    };
    
    return sessionData;
}

fn (sm: &mut SessionManager) deleteSession(sessionId: str) -> str ! bool {
    let sessionKey := sm.prefix + ":" + sessionId;
    let deleted := sm.client.Del([sessionKey]) catch |err| err;
    return deleted > 0;
}

fn (sm: &mut SessionManager) refreshSession(sessionId: str) -> str ! bool {
    let sessionKey := sm.prefix + ":" + sessionId;
    return sm.client.Expire(sessionKey, sm.defaultTTL) catch |err| err;
}

fn main() {
    let mut sessionMgr := newSessionManager("127.0.0.1:6379", "sessions") catch |err| {
        io::Printf("Failed to create session manager: %s\n", err);
        return;
    };
    
    defer sessionMgr.close();
    
    // Create a session
    let sessionId := sessionMgr.createSession("user123") catch |err| {
        io::Printf("Failed to create session: %s\n", err);
        return;
    };
    
    io::Printf("Created session: %s\n", sessionId);
    
    // Retrieve session
    let sessionData := sessionMgr.getSession(sessionId) catch |err| {
        io::Printf("Failed to get session: %s\n", err);
        return;
    };
    
    io::Println("Session data retrieved successfully");
    
    // Refresh session
    sessionMgr.refreshSession(sessionId) catch |err| {
        io::Printf("Failed to refresh session: %s\n", err);
    };
    
    // Clean up
    sessionMgr.deleteSession(sessionId) catch |err| {
        io::Printf("Failed to delete session: %s\n", err);
    };
    
    io::Println("Session management demo completed");
}
```

### Caching Layer
```ferret title="example"
import "db/redis";
import "std/io";
import "time";
import "os";

type Cache struct {
    .client: redis::Client,
    .prefix: str,
    .defaultTTL: i32
};

fn newCache(redisAddr: str, prefix: str) -> str ! Cache {
    let client := redis::Connect(redisAddr) catch |err| err;
    
    return Cache{
        .client: client,
        .prefix: prefix,
        .defaultTTL: 300  // 5 minutes default
    };
}

fn (c: &mut Cache) close() {
    c.client.Close();
}

fn (c: &mut Cache) makeKey(key: str) -> str {
    return c.prefix + ":" + key;
}

fn (c: &mut Cache) set(key: str, value: str, ttl: ?i32) -> str ! bool {
    let cacheKey := c.makeKey(key);
    
    c.client.Set(cacheKey, value) catch |err| err;
    
    let expireTime := match ttl {
        some(t) => t,
        none => c.defaultTTL
    };
    
    return c.client.Expire(cacheKey, expireTime) catch |err| err;
}

fn (c: &mut Cache) get(key: str) -> str ! str {
    let cacheKey := c.makeKey(key);
    return c.client.Get(cacheKey) catch |err| err;
}

fn (c: &mut Cache) delete(key: str) -> str ! bool {
    let cacheKey := c.makeKey(key);
    let deleted := c.client.Del([cacheKey]) catch |err| err;
    return deleted > 0;
}

fn (c: &mut Cache) exists(key: str) -> str ! bool {
    let cacheKey := c.makeKey(key);
    let count := c.client.Exists([cacheKey]) catch |err| err;
    return count > 0;
}

fn (c: &mut Cache) getTTL(key: str) -> str ! i32 {
    let cacheKey := c.makeKey(key);
    return c.client.TTL(cacheKey) catch |err| err;
}

// Example usage with expensive computation
fn expensiveComputation(input: str) -> str {
    // Simulate expensive work
    os::SleepMs(2000);
    return "computed_" + input + "_" + (time::NowUnix() as str);
}

fn cachedComputation(cache: &mut Cache, input: str) -> str ! str {
    let cacheKey := "computation:" + input;
    
    // Try to get from cache first
    let cached := cache.get(cacheKey);
    match cached {
        ok(value) => {
            io::Printf("Cache HIT for %s\n", input);
            return value;
        },
        err(_) => {
            io::Printf("Cache MISS for %s, computing...\n", input);
            
            // Compute and cache result
            let result := expensiveComputation(input);
            cache.set(cacheKey, result, some(600)) catch |err| {
                io::Printf("Failed to cache result: %s\n", err);
            };
            
            return result;
        }
    }
}

fn main() {
    let mut cache := newCache("127.0.0.1:6379", "myapp_cache") catch |err| {
        io::Printf("Failed to create cache: %s\n", err);
        return;
    };
    
    defer cache.close();
    
    // Test caching
    let inputs := ["input1", "input2", "input1"]; // Note: input1 appears twice
    
    for input in inputs {
        let result := cachedComputation(&mut cache, input) catch |err| {
            io::Printf("Computation failed for %s: %s\n", input, err);
            continue;
        };
        
        io::Printf("Result for %s: %s\n", input, result);
    }
    
    // Check cache statistics
    let exists1 := cache.exists("computation:input1") catch |err| false;
    let ttl1 := cache.getTTL("computation:input1") catch |err| -1;
    
    io::Printf("input1 cached: %b, TTL: %d seconds\n", exists1, ttl1);
}
```

### Rate Limiting
```ferret title="example"
import "db/redis";
import "std/io";
import "time";
import "os";

type RateLimiter struct {
    .client: redis::Client,
    .prefix: str
};

fn newRateLimiter(redisAddr: str) -> str ! RateLimiter {
    let client := redis::Connect(redisAddr) catch |err| err;
    
    return RateLimiter{
        .client: client,
        .prefix: "rate_limit"
    };
}

fn (rl: &mut RateLimiter) close() {
    rl.client.Close();
}

fn (rl: &mut RateLimiter) checkLimit(identifier: str, limit: i32, windowSec: i32) -> str ! bool {
    let key := rl.prefix + ":" + identifier;
    
    // Get current count
    let currentStr := rl.client.Get(key);
    let current := match currentStr {
        ok(s) => {
            // Parse string to int (simplified)
            1 // Would parse s to integer
        },
        err(_) => 0
    };
    
    if current >= limit {
        return false; // Rate limit exceeded
    }
    
    // Increment counter
    let newCount := current + 1;
    rl.client.Set(key, newCount as str) catch |err| err;
    
    // Set expiration if this is the first request
    if current == 0 {
        rl.client.Expire(key, windowSec) catch |err| {
            // Non-fatal error
        };
    }
    
    return true; // Request allowed
}

fn (rl: &mut RateLimiter) getRemainingRequests(identifier: str, limit: i32) -> str ! i32 {
    let key := rl.prefix + ":" + identifier;
    
    let currentStr := rl.client.Get(key) catch |err| {
        return limit; // No requests made yet
    };
    
    // Parse current count (simplified)
    let current := 1; // Would parse currentStr to integer
    
    let remaining := limit - current;
    return if remaining < 0 { 0 } else { remaining };
}

fn simulateAPIRequest(rl: &mut RateLimiter, clientId: str) -> bool {
    let limit := 10; // 10 requests
    let window := 60; // per 60 seconds
    
    let allowed := rl.checkLimit(clientId, limit, window) catch |err| {
        io::Printf("Rate limiter error: %s\n", err);
        return false;
    };
    
    if allowed {
        let remaining := rl.getRemainingRequests(clientId, limit) catch |err| -1;
        io::Printf("Request from %s: ALLOWED (remaining: %d)\n", clientId, remaining);
        return true;
    } else {
        io::Printf("Request from %s: BLOCKED (rate limit exceeded)\n", clientId);
        return false;
    }
}

fn main() {
    let mut rateLimiter := newRateLimiter("127.0.0.1:6379") catch |err| {
        io::Printf("Failed to create rate limiter: %s\n", err);
        return;
    };
    
    defer rateLimiter.close();
    
    // Simulate API requests from different clients
    let clients := ["client_a", "client_b", "client_a"];
    
    for i in 0..15 { // More requests than limit
        let clientIndex := i % len(&clients);
        let client := at(&clients, clientIndex);
        match client {
            some(clientId) => {
                simulateAPIRequest(&mut rateLimiter, clientId);
                os::SleepMs(100); // Small delay between requests
            },
            none => {}
        }
    }
}
```

### Pub/Sub Messaging (Simplified)
```ferret title="example"
import "db/redis";
import "std/io";
import "time";
import "os";

// Note: This is a simplified example. Real pub/sub would require
// concurrent handling and proper RESP parsing for pub/sub messages.

fn publishMessage(client: &mut redis::Client, channel: str, message: str) -> str ! bool {
    // In a real implementation, this would use PUBLISH command
    // For now, we'll use a list to simulate message queue
    let queueKey := "queue:" + channel;
    let messageData := time::Now() + "|" + message;
    
    let length := client.RPush(queueKey, [messageData]) catch |err| err;
    return length > 0;
}

fn consumeMessages(client: &mut redis::Client, channel: str, maxMessages: i32) -> []str {
    let queueKey := "queue:" + channel;
    let mut messages := []str{};
    
    for i in 0..maxMessages {
        let message := client.LPop(queueKey);
        match message {
            ok(msg) => append(&mut messages, msg),
            err(_) => break // No more messages
        }
    }
    
    return messages;
}

fn main() {
    let mut publisher := redis::Connect("127.0.0.1:6379") catch |err| {
        io::Printf("Publisher connection failed: %s\n", err);
        return;
    };
    defer publisher.Close();
    
    let mut consumer := redis::Connect("127.0.0.1:6379") catch |err| {
        io::Printf("Consumer connection failed: %s\n", err);
        return;
    };
    defer consumer.Close();
    
    let channel := "notifications";
    
    // Publish some messages
    let messages := [
        "User john_doe logged in",
        "New order #12345 created",
        "Payment processed for order #12345",
        "Order #12345 shipped"
    ];
    
    io::Println("Publishing messages...");
    for msg in messages {
        publishMessage(&mut publisher, channel, msg) catch |err| {
            io::Printf("Failed to publish: %s\n", err);
        };
        io::Printf("Published: %s\n", msg);
    }
    
    io::Println("\nConsuming messages...");
    let receivedMessages := consumeMessages(&mut consumer, channel, 10);
    
    for msg in receivedMessages {
        // Parse timestamp and message
        io::Printf("Received: %s\n", msg);
        
        // Simulate message processing
        os::SleepMs(100);
    }
    
    io::Printf("Processed %d messages\n", len(&receivedMessages));
}
```

## Best Practices

1. **Connection Management**
   - Always close connections when done
   - Use connection pooling for high-throughput applications
   - Handle connection failures gracefully

2. **Error Handling**
   - Always handle Redis errors appropriately
   - Implement retry logic for transient failures
   - Log errors for debugging

3. **Key Naming**
   - Use consistent key naming conventions
   - Include prefixes to avoid collisions
   - Use descriptive names

4. **Expiration**
   - Set TTL on temporary data
   - Use appropriate expiration times
   - Monitor expired key cleanup

5. **Data Types**
   - Choose appropriate Redis data types for your use case
   - Use hashes for structured data
   - Use sets for unique collections
   - Use lists for queues and ordered data

6. **Performance**
   - Use pipelining for multiple commands
   - Avoid large values in Redis
   - Monitor memory usage
   - Use appropriate data structures

## Security Considerations

- **Authentication**: Configure Redis AUTH if available
- **Network Security**: Use secure networks or VPN
- **Input Validation**: Validate data before storing
- **Access Control**: Limit Redis command access
- **Encryption**: Consider Redis TLS for sensitive data

## See Also

- [TCP Module](/docs/stdlib/tcp) - Underlying networking primitives
- [Error Handling](/docs/advanced/errors) - Handling database errors
- [Time Module](/docs/stdlib/time) - Timestamps and TTL management
- [HTTP Module](/docs/stdlib/http) - Building web apps with Redis backend