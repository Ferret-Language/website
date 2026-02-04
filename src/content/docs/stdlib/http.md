---
title: net/http
description: HTTP server and client in Ferret
---

The `net/http` module provides a high-level HTTP server framework with an Express.js-inspired API, making it easy to build web applications and REST APIs.

## Import

```ferret
import "net/http";
import "net/tcp"; // Often used together
```

## Types

### `Request`
```ferret
type Request struct {
    .Method: str,            // "GET", "POST", "PUT", "DELETE", etc.
    .Path: str,              // URL path without query string
    .Url: str,               // Full URL path with query string
    .Query: map[str]str,     // Query parameters (?a=1&b=2)
    .Params: map[str]str,    // Route parameters (/users/:id)
    .Headers: map[str]str,   // Request headers
    .Body: str,              // Body as UTF-8 string
    .BodyBytes: []byte,      // Raw body bytes
    .IP: str                 // Remote client IP address
};
```

### `Response`
```ferret
type Response struct {
    .handle: i64             // Internal response handle
};
```

### `App`
```ferret
type App struct {
    .handle: i64             // Internal app handle
};
```

## Creating an HTTP Server

### Server()
```ferret
fn Server() -> App
```
Creates a new HTTP application instance.

```ferret title="example"
import "net/http";
import "std/io";

fn main() {
    let app := http::Server();
    
    app.Get("/", fn(req: &Request, res: &mut Response) {
        res.Send("Hello, World!");
    });
    
    io::Println("Server starting on port 3000...");
    app.Listen(3000) catch |err| {
        io::Printf("Failed to start server: {}\n", err);
    };
}
```

## Server Lifecycle

### Listen()
```ferret
fn (app: &App) Listen(port: i32) -> str ! bool
```
Starts the HTTP server on the specified port.

```ferret title="example"
import "net/http";
import "std/io";

let app := http::Server();

// Set up routes first
app.Get("/health", fn(req: &Request, res: &mut Response) {
    res.Json("{\"status\": \"ok\"}");
});

// Start server
io::Println("Starting server on port 8080...");
app.Listen(8080) catch |err| {
    io::Printf("Server error: {}\n", err);
};
```

### ListenAddrNative()
```ferret
fn (app: &App) ListenAddrNative(addr: str) -> str ! bool
```
Starts the server on a specific address and port.

```ferret title="example"
import "net/http";
import "std/io";

let app := http::Server();

app.Get("/", fn(req: &Request, res: &mut Response) {
    res.Send("Server running on specific address");
});

// Listen on specific interface
app.ListenAddrNative("127.0.0.1:3000") catch |err| {
    io::Printf("Failed to listen: {}\n", err);
};
```

### Close()
```ferret
fn (app: &App) Close()
```
Gracefully stops the HTTP server.

### Serve()
```ferret
fn (app: &App) Serve(listener: tcp::TcpListener) -> str ! bool
```
Serves HTTP on an existing TCP listener.

## Routing

### HTTP Method Handlers

```ferret
fn (app: &App) Get(path: str, handler: fn(req: &Request, res: &mut Response) -> void)
fn (app: &App) Post(path: str, handler: fn(req: &Request, res: &mut Response) -> void)
fn (app: &App) Put(path: str, handler: fn(req: &Request, res: &mut Response) -> void)
fn (app: &App) Patch(path: str, handler: fn(req: &Request, res: &mut Response) -> void)
fn (app: &App) Delete(path: str, handler: fn(req: &Request, res: &mut Response) -> void)
fn (app: &App) Options(path: str, handler: fn(req: &Request, res: &mut Response) -> void)
fn (app: &App) Head(path: str, handler: fn(req: &Request, res: &mut Response) -> void)
fn (app: &App) Any(path: str, handler: fn(req: &Request, res: &mut Response) -> void)
```

```ferret title="example"
import "net/http";
import "std/io";

let app := http::Server();

// Different HTTP methods
app.Get("/users", fn(req: &Request, res: &mut Response) {
    res.Json("[{\"id\": 1, \"name\": \"Alice\"}]");
});

app.Post("/users", fn(req: &Request, res: &mut Response) {
    io::Printf("Creating user with data: {}\n", req.Body);
    res.Status(201).Json("{\"id\": 2, \"name\": \"Bob\"}");
});

app.Put("/users/:id", fn(req: &Request, res: &mut Response) {
    let userId := req.Param("id");
    match userId {
        some(id) => {
            io::Printf("Updating user {}\n", id);
            res.Json("{\"id\": \"" + id + "\", \"updated\": true}");
        },
        none => res.Status(400).Send("Missing user ID")
    }
});

app.Delete("/users/:id", fn(req: &Request, res: &mut Response) {
    let userId := req.Param("id");
    match userId {
        some(id) => {
            io::Printf("Deleting user {}\n", id);
            res.Status(204).Send("");
        },
        none => res.Status(400).Send("Missing user ID")
    }
});

// Handle any method
app.Any("/health", fn(req: &Request, res: &mut Response) {
    res.Send("OK");
});

app.Listen(3000) catch |err| {
    io::Printf("Server error: {}\n", err);
};
```

### Middleware

### Use()
```ferret
fn (app: &App) Use(handler: fn(req: &Request, res: &mut Response, next: fn() -> void) -> void)
```
Registers middleware that runs before route handlers.

```ferret title="example"
import "net/http";
import "std/io";
import "time";

let app := http::Server();

// Logging middleware
app.Use(fn(req: &Request, res: &mut Response, next: fn() -> void) {
    let timestamp := time::Now();
    io::Printf("[{}] {} {} from {}\n", timestamp, req.Method, req.Path, req.IP);
    next(); // Continue to next handler
});

// CORS middleware
app.Use(fn(req: &Request, res: &mut Response, next: fn() -> void) {
    res.Header("Access-Control-Allow-Origin", "*");
    res.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.Header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if req.Method == "OPTIONS" {
        res.Status(200).Send("");
        return;
    }
    
    next();
});

// Authentication middleware (simplified)
app.Use(fn(req: &Request, res: &mut Response, next: fn() -> void) {
    let authHeader := req.Header("Authorization");
    match authHeader {
        some(token) => {
            if token.startsWith("Bearer ") {
                next(); // Valid token, continue
            } else {
                res.Status(401).Json("{\"error\": \"Invalid token format\"}");
            }
        },
        none => {
            if req.Path == "/login" || req.Path == "/health" {
                next(); // Allow unauthenticated access
            } else {
                res.Status(401).Json("{\"error\": \"Authentication required\"}");
            }
        }
    }
});

app.Get("/protected", fn(req: &Request, res: &mut Response) {
    res.Json("{\"message\": \"This is protected data\"}");
});

app.Post("/login", fn(req: &Request, res: &mut Response) {
    res.Json("{\"token\": \"your-jwt-token-here\"}");
});

app.Listen(3000) catch |err| {
    io::Printf("Server error: {}\n", err);
};
```

### Static Files

### Static()
```ferret
fn (app: &App) Static(prefix: str, dir: str)
```
Serves static files from a directory.

```ferret title="example"
import "net/http";
import "std/io";

let app := http::Server();

// Serve static files from ./public directory
app.Static("/static", "./public");

// Serve files from root
app.Static("/", "./www");

// API routes
app.Get("/api/status", fn(req: &Request, res: &mut Response) {
    res.Json("{\"status\": \"API is running\"}");
});

app.Listen(3000) catch |err| {
    io::Printf("Server error: {}\n", err);
};
```

## Request Helpers

### Header()
```ferret
fn (req: &Request) Header(name: str) -> str?
```
Retrieves a request header value.

### Query()
```ferret
fn (req: &Request) Query(name: str) -> str?
```
Retrieves a query parameter value.

### Param()
```ferret
fn (req: &Request) Param(name: str) -> str?
```
Retrieves a route parameter value.

```ferret title="example"
import "net/http";
import "std/io";

let app := http::Server();

app.Get("/search/:category", fn(req: &Request, res: &mut Response) {
    // Route parameter
    let category := req.Param("category");
    
    // Query parameters (/search/books?q=rust&limit=10)
    let query := req.Query("q");
    let limit := req.Query("limit");
    
    // Request headers
    let userAgent := req.Header("User-Agent");
    let contentType := req.Header("Content-Type");
    
    let response := "{" +
        "\"category\": \"" + (category.unwrap_or("unknown")) + "\"," +
        "\"query\": \"" + (query.unwrap_or("")) + "\"," +
        "\"limit\": \"" + (limit.unwrap_or("10")) + "\"," +
        "\"user_agent\": \"" + (userAgent.unwrap_or("unknown")) + \"\"" +
        "}";
    
    res.Json(response);
});

app.Post("/upload", fn(req: &Request, res: &mut Response) {
    io::Printf("Received {} bytes\n", len(&req.BodyBytes));
    io::Printf("Body as string: {}\n", req.Body);
    
    res.Json("{\"message\": \"Upload received\"}");
});

app.Listen(3000) catch |err| {
    io::Printf("Server error: {}\n", err);
};
```

## Response Helpers

### Send()
```ferret
fn (res: &mut Response) Send(content: str)
```
Sends a plain text response.

### Json()
```ferret
fn (res: &mut Response) Json(jsonContent: str)
```
Sends a JSON response with appropriate headers.

### Status()
```ferret
fn (res: &mut Response) Status(code: i32) -> &mut Response
```
Sets the HTTP status code and returns the response for method chaining.

### Header()
```ferret
fn (res: &mut Response) Header(name: str, value: str) -> &mut Response
```
Sets a response header and returns the response for method chaining.

### Redirect()
```ferret
fn (res: &mut Response) Redirect(url: str)
```
Sends a redirect response.

```ferret title="example"
import "net/http";
import "std/io";

let app := http::Server();

// Plain text response
app.Get("/text", fn(req: &Request, res: &mut Response) {
    res.Send("This is plain text");
});

// JSON response
app.Get("/api/user/:id", fn(req: &Request, res: &mut Response) {
    let userId := req.Param("id");
    match userId {
        some(id) => {
            let jsonResponse := "{\"id\": \"" + id + "\", \"name\": \"User " + id + "\"}"; 
            res.Json(jsonResponse);
        },
        none => {
            res.Status(400).Json("{\"error\": \"User ID required\"}");
        }
    }
});

// Custom headers and status
app.Get("/download", fn(req: &Request, res: &mut Response) {
    res.Status(200)
       .Header("Content-Type", "application/octet-stream")
       .Header("Content-Disposition", "attachment; filename=\"data.txt\"")
       .Send("File content here");
});

// Error responses
app.Get("/error", fn(req: &Request, res: &mut Response) {
    res.Status(500).Json("{\"error\": \"Internal server error\"}");
});

// Redirect
app.Get("/old-page", fn(req: &Request, res: &mut Response) {
    res.Redirect("/new-page");
});

app.Get("/new-page", fn(req: &Request, res: &mut Response) {
    res.Send("You've been redirected!");
});

app.Listen(3000) catch |err| {
    io::Printf("Server error: {}\n", err);
};
```

## Practical Examples

### REST API Server
```ferret title="run"
import "net/http";
import "std/io";
import "std/fs";

type User struct {
    .id: i32,
    .name: str,
    .email: str
};

type ApiServer struct {
    .users: []User,
    .nextId: i32
};

fn newApiServer() -> ApiServer {
    return ApiServer{
        .users: []User{},
        .nextId: 1
    };
}

fn findUser(server: &ApiServer, id: i32) -> User? {
    for user in server.users {
        if user.id == id {
            return some(user);
        }
    }
    return none;
}

fn addUser(server: &mut ApiServer, name: str, email: str) -> User {
    let user := User{
        .id: server.nextId,
        .name: name,
        .email: email
    };
    
    append(&mut server.users, user);
    server.nextId += 1;
    
    return user;
}

fn serializeUser(user: User) -> str {
    return "{\"id\": " + (user.id as str) + 
           ", \"name\": \"" + user.name + 
           "\", \"email\": \"" + user.email + "\"}";
}

fn serializeUsers(users: []User) -> str {
    let result := "[";
    for i in 0..len(&users) {
        let user := at(&users, i);
        match user {
            some(u) => {
                if i > 0 {
                    result = result + ", ";
                }
                result = result + serializeUser(u);
            },
            none => {}
        }
    }
    result = result + "]";
    return result;
}

fn main() {
    let mut server := newApiServer();
    
    // Add some sample data
    addUser(&mut server, "Alice", "alice@example.com");
    addUser(&mut server, "Bob", "bob@example.com");
    
    let app := http::Server();
    
    // Middleware for logging
    app.Use(fn(req: &Request, res: &mut Response, next: fn() -> void) {
        io::Printf("{} {} {}\n", req.Method, req.Path, req.IP);
        next();
    });
    
    // CORS headers
    app.Use(fn(req: &Request, res: &mut Response, next: fn() -> void) {
        res.Header("Access-Control-Allow-Origin", "*");
        res.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.Header("Access-Control-Allow-Headers", "Content-Type");
        next();
    });
    
    // Routes
    app.Get("/api/users", fn(req: &Request, res: &mut Response) {
        let json := serializeUsers(server.users);
        res.Json(json);
    });
    
    app.Get("/api/users/:id", fn(req: &Request, res: &mut Response) {
        let userIdStr := req.Param("id");
        match userIdStr {
            some(idStr) => {
                // Parse ID (simplified)
                let id := 1; // Would parse from idStr
                let user := findUser(&server, id);
                match user {
                    some(u) => res.Json(serializeUser(u)),
                    none => res.Status(404).Json("{\"error\": \"User not found\"}")
                }
            },
            none => res.Status(400).Json("{\"error\": \"User ID required\"}")
        }
    });
    
    app.Post("/api/users", fn(req: &Request, res: &mut Response) {
        // In a real implementation, would parse JSON from req.Body
        let newUser := addUser(&mut server, "New User", "new@example.com");
        res.Status(201).Json(serializeUser(newUser));
    });
    
    app.Get("/", fn(req: &Request, res: &mut Response) {
        let html := "<!DOCTYPE html>" +
                    "<html><head><title>User API</title></head>" +
                    "<body><h1>User API Server</h1>" +
                    "<p>Endpoints:</p><ul>" +
                    "<li>GET /api/users - List all users</li>" +
                    "<li>GET /api/users/:id - Get user by ID</li>" +
                    "<li>POST /api/users - Create new user</li>" +
                    "</ul></body></html>";
        res.Header("Content-Type", "text/html").Send(html);
    });
    
    io::Println("REST API Server starting on port 3000...");
    io::Println("Try: curl http://localhost:3000/api/users");
    
    app.Listen(3000) catch |err| {
        io::Printf("Server error: {}\n", err);
    };
}
```

### File Upload Server
```ferret title="example"
import "net/http";
import "std/io";
import "std/fs";
import "time";

fn handleFileUpload(req: &Request, res: &mut Response) {
    if req.Method != "POST" {
        res.Status(405).Json("{\"error\": \"Method not allowed\"}");
        return;
    }
    
    let contentType := req.Header("Content-Type");
    match contentType {
        some(ct) => {
            if !ct.contains("multipart/form-data") {
                res.Status(400).Json("{\"error\": \"Expected multipart/form-data\"}");
                return;
            }
        },
        none => {
            res.Status(400).Json("{\"error\": \"Content-Type required\"}");
            return;
        }
    }
    
    // Generate unique filename
    let timestamp := time::NowUnixMs();
    let filename := "upload_" + (timestamp as str) + ".bin";
    let filepath := "./uploads/" + filename;
    
    // Save file (simplified - would parse multipart in real implementation)
    fs::WriteFile(filepath, req.Body) catch |err| {
        io::Printf("Failed to save file: {}\n", err);
        res.Status(500).Json("{\"error\": \"Failed to save file\"}");
        return;
    };
    
    let response := "{\"success\": true, \"filename\": \"" + filename + 
                    "\", \"size\": " + (len(&req.BodyBytes) as str) + "}";
    
    res.Status(201).Json(response);
}

fn main() {
    let app := http::Server();
    
    // Create uploads directory
    // fs::CreateDir("./uploads") catch |err| {}; // Would create directory
    
    app.Post("/upload", handleFileUpload);
    
    app.Get("/upload", fn(req: &Request, res: &mut Response) {
        let html := "<!DOCTYPE html>" +
                    "<html><head><title>File Upload</title></head>" +
                    "<body><h1>File Upload</h1>" +
                    "<form action='/upload' method='post' enctype='multipart/form-data'>" +
                    "<input type='file' name='file' required>" +
                    "<button type='submit'>Upload</button>" +
                    "</form></body></html>";
        res.Header("Content-Type", "text/html").Send(html);
    });
    
    app.Listen(3000) catch |err| {
        io::Printf("Server error: {}\n", err);
    };
}
```

### WebSocket-like Server (Simplified)
```ferret title="example"
import "net/http";
import "std/io";
import "time";

type ChatMessage struct {
    .timestamp: str,
    .user: str,
    .message: str
};

fn newChatMessage(user: str, message: str) -> ChatMessage {
    return ChatMessage{
        .timestamp: time::Now(),
        .user: user,
        .message: message
    };
}

fn serializeChatMessage(msg: ChatMessage) -> str {
    return "{\"timestamp\": \"" + msg.timestamp + 
           "\", \"user\": \"" + msg.user + 
           "\", \"message\": \"" + msg.message + "\"}"; 
}

fn main() {
    let mut messages := []ChatMessage{};
    
    let app := http::Server();
    
    // Serve chat interface
    app.Get("/", fn(req: &Request, res: &mut Response) {
        let html := "<!DOCTYPE html>" +
                    "<html><head><title>Simple Chat</title></head>" +
                    "<body><h1>Chat Room</h1>" +
                    "<div id='messages'></div>" +
                    "<form id='chatForm'>" +
                    "<input id='user' placeholder='Your name' required>" +
                    "<input id='message' placeholder='Message' required>" +
                    "<button type='submit'>Send</button>" +
                    "</form>" +
                    "<script>" +
                    "document.getElementById('chatForm').onsubmit = function(e) {" +
                    "  e.preventDefault();" +
                    "  const user = document.getElementById('user').value;" +
                    "  const message = document.getElementById('message').value;" +
                    "  fetch('/api/messages', {" +
                    "    method: 'POST'," +
                    "    headers: {'Content-Type': 'application/json'}," +
                    "    body: JSON.stringify({user, message})" +
                    "  });" +
                    "  document.getElementById('message').value = '';" +
                    "};" +
                    "</script></body></html>";
        res.Header("Content-Type", "text/html").Send(html);
    });
    
    // Get messages API
    app.Get("/api/messages", fn(req: &Request, res: &mut Response) {
        let result := "[";
        for i in 0..len(&messages) {
            let msg := at(&messages, i);
            match msg {
                some(m) => {
                    if i > 0 {
                        result = result + ", ";
                    }
                    result = result + serializeChatMessage(m);
                },
                none => {}
            }
        }
        result = result + "]";
        res.Json(result);
    });
    
    // Post message API
    app.Post("/api/messages", fn(req: &Request, res: &mut Response) {
        // In real implementation, would parse JSON from req.Body
        let msg := newChatMessage("User", "Hello from HTTP!");
        append(&mut messages, msg);
        
        res.Status(201).Json(serializeChatMessage(msg));
    });
    
    io::Println("Chat server starting on port 3000...");
    app.Listen(3000) catch |err| {
        io::Printf("Server error: {}\n", err);
    };
}
```

## Best Practices

1. **Use middleware** for cross-cutting concerns (logging, CORS, authentication)
2. **Handle errors gracefully** - Always provide meaningful error responses
3. **Validate input** - Never trust client data
4. **Set appropriate status codes** - Follow HTTP conventions
5. **Use proper content types** - Set `Content-Type` headers correctly
6. **Implement rate limiting** - Prevent abuse
7. **Log requests** - For debugging and monitoring
8. **Secure headers** - Add security headers (CORS, CSP, etc.)
9. **Clean shutdown** - Handle server shutdown gracefully

## Security Considerations

- **Input validation**: Sanitize all user input
- **Authentication**: Implement proper authentication middleware
- **Authorization**: Check user permissions before sensitive operations
- **HTTPS**: Use TLS in production (configure at reverse proxy level)
- **CORS**: Configure Cross-Origin Resource Sharing appropriately
- **Rate limiting**: Prevent abuse and DoS attacks
- **Security headers**: Add headers like CSP, HSTS, X-Frame-Options

## Performance Tips

- **Static file serving**: Use dedicated static file servers in production
- **Gzip compression**: Compress responses (configure at reverse proxy)
- **Connection pooling**: Reuse database connections
- **Caching**: Implement response caching where appropriate
- **Async handling**: Handle long-running operations asynchronously

## See Also

- [TCP Module](/docs/stdlib/tcp) - Low-level TCP networking
- [Filesystem](/docs/stdlib/fs) - File operations for serving static content
- [Error Handling](/docs/advanced/errors) - Handling HTTP errors properly
- [Time Module](/docs/stdlib/time) - Timestamps and timeouts
