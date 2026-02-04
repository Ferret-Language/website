---
title: net/tcp
description: TCP networking in Ferret
---

The `net/tcp` module provides low-level TCP networking capabilities for building network applications.

## Import

```ferret
import "net/tcp";
```

## Types

### IpAddr
```ferret
type IpAddr struct {
    .Value: str
};
```
Wrapper for IP address strings.

### SocketAddr
```ferret
type SocketAddr struct {
    .Host: str,
    .Port: i32
};
```
Combination of host and port for socket addresses.

### TcpListener
```ferret
type TcpListener struct {
    .handle: i64,   // Internal listener handle
    .addr: str      // Address being listened on
};
```
Represents a TCP server listener.

### TcpConn
```ferret
type TcpConn struct {
    .handle: i64,   // Internal connection handle
    .local: str,    // Local address
    .remote: str    // Remote address
};
```
Represents an active TCP connection.

## Server Functions

### ListenTcp()
```ferret
fn ListenTcp(addr: str) -> str ! TcpListener
```
Creates a TCP listener on the specified address.

```ferret title="example"
import "net/tcp";
import "std/io";

let listener := tcp::ListenTcp("0.0.0.0:8080") catch |err| {
    io::Printf("Failed to listen: {}\n", err);
    return;
};

io::Println("Server listening on port 8080");
```

### Accept()
```ferret
fn Accept(listener: TcpListener) -> str ! TcpConn
```
Accepts an incoming connection on the listener.

```ferret title="example"
import "net/tcp";
import "std/io";

fn handleConnection(conn: TcpConn) {
    io::Printf("New connection from: {}\n", conn.remote);
    
    // Handle the connection
    let data := tcp::Read(conn, 1024) catch |err| {
        io::Printf("Read error: {}\n", err);
        tcp::CloseConn(conn);
        return;
    };
    
    // Echo the data back
    tcp::Write(conn, data) catch |err| {
        io::Printf("Write error: {}\n", err);
    };
    
    tcp::CloseConn(conn);
}

fn main() {
    let listener := tcp::ListenTcp("127.0.0.1:8080") catch |err| {
        io::Printf("Listen error: {}\n", err);
        return;
    };
    
    defer tcp::CloseListener(listener);
    
    io::Println("Echo server started on port 8080");
    
    while true {
        let conn := tcp::Accept(listener) catch |err| {
            io::Printf("Accept error: {}\n", err);
            continue;
        };
        
        handleConnection(conn);
    }
}
```

## Client Functions

### DialTcp()
```ferret
fn DialTcp(addr: str) -> str ! TcpConn
```
Establishes a TCP connection to the specified address.

```ferret title="example"
import "net/tcp";
import "std/io";

let conn := tcp::DialTcp("127.0.0.1:8080") catch |err| {
    io::Printf("Connection failed: {}\n", err);
    return;
};

defer tcp::CloseConn(conn);

io::Printf("Connected to server: {}\n", conn.remote);

// Send some data
let message := "Hello, server!" as []byte;
tcp::Write(conn, message) catch |err| {
    io::Printf("Write error: {}\n", err);
    return;
};

// Read response
let response := tcp::Read(conn, 1024) catch |err| {
    io::Printf("Read error: {}\n", err);
    return;
};

io::Printf("Server response: {}\n", response as str);
```

## I/O Functions

### Read()
```ferret
fn Read(conn: TcpConn, maxBytes: i32) -> str ! []byte
```
Reads up to `maxBytes` from the connection.

```ferret title="example"
import "net/tcp";
import "std/io";

fn readAllData(conn: TcpConn) -> []byte {
    let mut allData := []byte{};
    let bufferSize := 1024;
    
    while true {
        let chunk := tcp::Read(conn, bufferSize) catch |err| {
            io::Printf("Read error: {}\n", err);
            break;
        };
        
        if len(&chunk) == 0 {
            break; // Connection closed
        }
        
        // Append chunk to allData
        for b in chunk {
            append(&mut allData, b);
        }
        
        if len(&chunk) < bufferSize {
            break; // Likely end of data
        }
    }
    
    return allData;
}
```

### Write()
```ferret
fn Write(conn: TcpConn, data: []byte) -> str ! i32
```
Writes data to the connection and returns the number of bytes written.

```ferret title="example"
import "net/tcp";
import "std/io";

fn sendMessage(conn: TcpConn, message: str) -> bool {
    let data := message as []byte;
    let bytesWritten := tcp::Write(conn, data) catch |err| {
        io::Printf("Write failed: {}\n", err);
        return false;
    };
    
    io::Printf("Sent {} bytes\n", bytesWritten);
    return true;
}
```

### WriteLine()
```ferret
fn WriteLine(conn: TcpConn, line: str) -> str ! i32
```
Writes a line followed by a newline character.

```ferret title="example"
import "net/tcp";
import "std/io";

fn sendCommand(conn: TcpConn, command: str) {
    tcp::WriteLine(conn, command) catch |err| {
        io::Printf("Failed to send command: {}\n", err);
    };
}
```

### ReadLine()
```ferret
fn ReadLine(conn: TcpConn) -> str ! str
```
Reads a line from the connection (until newline character).

```ferret title="example"
import "net/tcp";
import "std/io";

fn readResponse(conn: TcpConn) -> str {
    let line := tcp::ReadLine(conn) catch |err| {
        io::Printf("Failed to read line: {}\n", err);
        return "";
    };
    
    return line;
}
```

## Connection Management

### CloseConn()
```ferret
fn CloseConn(conn: TcpConn)
```
Closes a TCP connection.

### CloseListener()
```ferret
fn CloseListener(listener: TcpListener)
```
Closes a TCP listener.

## Practical Examples

### Echo Server
```ferret title="run"
import "net/tcp";
import "std/io";

fn echoHandler(conn: TcpConn) {
    io::Printf("[{}] Client connected\n", conn.remote);
    
    while true {
        let data := tcp::Read(conn, 4096) catch |err| {
            io::Printf("[{}] Read error: {}\n", conn.remote, err);
            break;
        };
        
        if len(&data) == 0 {
            io::Printf("[{}] Client disconnected\n", conn.remote);
            break;
        }
        
        // Echo data back to client
        tcp::Write(conn, data) catch |err| {
            io::Printf("[{}] Write error: {}\n", conn.remote, err);
            break;
        };
        
        io::Printf("[{}] Echoed {} bytes\n", conn.remote, len(&data));
    }
    
    tcp::CloseConn(conn);
}

fn main() {
    let listener := tcp::ListenTcp("127.0.0.1:8080") catch |err| {
        io::Printf("Failed to start server: {}\n", err);
        return;
    };
    
    defer tcp::CloseListener(listener);
    
    io::Println("Echo server listening on 127.0.0.1:8080");
    io::Println("Use 'telnet 127.0.0.1 8080' to test");
    
    while true {
        let conn := tcp::Accept(listener) catch |err| {
            io::Printf("Accept error: {}\n", err);
            continue;
        };
        
        // Handle connection (in a real server, this would be concurrent)
        echoHandler(conn);
    }
}
```

### Simple Chat Server
```ferret title="example"
import "net/tcp";
import "std/io";

type ChatServer struct {
    .clients: []TcpConn
};

fn newChatServer() -> ChatServer {
    return ChatServer{
        .clients: []TcpConn{}
    };
}

fn addClient(server: &mut ChatServer, conn: TcpConn) {
    append(&mut server.clients, conn);
    io::Printf("Client {} joined (total: {})\n", conn.remote, len(&server.clients));
}

fn removeClient(server: &mut ChatServer, targetConn: TcpConn) {
    // In a real implementation, would remove from clients array
    io::Printf("Client {} left\n", targetConn.remote);
}

fn broadcastMessage(server: &ChatServer, message: str, sender: TcpConn) {
    let formattedMsg := "[" + sender.remote + "]: " + message;
    let data := formattedMsg as []byte;
    
    for client in server.clients {
        if client.handle != sender.handle {
            tcp::Write(client, data) catch |err| {
                io::Printf("Failed to send to {}: {}\n", client.remote, err);
            };
        }
    }
}

fn handleChatClient(server: &mut ChatServer, conn: TcpConn) {
    addClient(server, conn);
    
    // Send welcome message
    let welcome := "Welcome to the chat server!\n";
    tcp::Write(conn, welcome as []byte) catch |err| {
        io::Printf("Failed to send welcome: {}\n", err);
    };
    
    while true {
        let line := tcp::ReadLine(conn) catch |err| {
            io::Printf("Read error from {}: {}\n", conn.remote, err);
            break;
        };
        
        if len(&(line as []char)) == 0 {
            break; // Client disconnected
        }
        
        // Broadcast message to all other clients
        broadcastMessage(server, line, conn);
    }
    
    removeClient(server, conn);
    tcp::CloseConn(conn);
}

fn main() {
    let mut server := newChatServer();
    
    let listener := tcp::ListenTcp("127.0.0.1:8081") catch |err| {
        io::Printf("Failed to start chat server: {}\n", err);
        return;
    };
    
    defer tcp::CloseListener(listener);
    
    io::Println("Chat server listening on 127.0.0.1:8081");
    
    while true {
        let conn := tcp::Accept(listener) catch |err| {
            io::Printf("Accept error: {}\n", err);
            continue;
        };
        
        // In a real implementation, this would be handled concurrently
        handleChatClient(&mut server, conn);
    }
}
```

### HTTP-like Client
```ferret title="example"
import "net/tcp";
import "std/io";

fn httpGet(host: str, port: i32, path: str) -> str {
    let address := host + ":" + (port as str);
    
    let conn := tcp::DialTcp(address) catch |err| {
        return "Connection error: " + err;
    };
    
    defer tcp::CloseConn(conn);
    
    // Send HTTP request
    let request := "GET " + path + " HTTP/1.1\r\n" +
                   "Host: " + host + "\r\n" +
                   "Connection: close\r\n" +
                   "\r\n";
    
    tcp::Write(conn, request as []byte) catch |err| {
        return "Write error: " + err;
    };
    
    // Read response
    let response := "";
    while true {
        let chunk := tcp::Read(conn, 4096) catch |err| {
            break;
        };
        
        if len(&chunk) == 0 {
            break;
        }
        
        response = response + (chunk as str);
    }
    
    return response;
}

fn main() {
    let response := httpGet("httpbin.org", 80, "/ip");
    io::Printf("HTTP Response:\n%s\n", response);
}
```

### Port Scanner
```ferret title="example"
import "net/tcp";
import "std/io";
import "time";
import "os";

fn scanPort(host: str, port: i32) -> bool {
    let address := host + ":" + (port as str);
    
    let conn := tcp::DialTcp(address) catch |err| {
        return false; // Port is closed or filtered
    };
    
    tcp::CloseConn(conn);
    return true; // Port is open
}

fn scanRange(host: str, startPort: i32, endPort: i32) {
    io::Printf("Scanning %s ports %d-%d...\n", host, startPort, endPort);
    
    let openPorts := []i32{};
    
    for port in startPort..=endPort {
        io::Printf("Scanning port %d...\r", port);
        
        if scanPort(host, port) {
            append(&mut openPorts, port);
            io::Printf("Port %d: OPEN\n", port);
        }
        
        // Small delay to avoid overwhelming the target
        os::SleepMs(10);
    }
    
    io::Printf("\nScan complete. Open ports: ");
    for port in openPorts {
        io::Printf("%d ", port);
    }
    io::Println("");
}

fn main() {
    let host := "127.0.0.1";
    scanRange(host, 20, 25);    // FTP, SSH, Telnet
    scanRange(host, 80, 90);    // HTTP range
    scanRange(host, 443, 443);  // HTTPS
    scanRange(host, 8000, 8080); // Common dev ports
}
```

### Simple Protocol Implementation
```ferret title="example"
import "net/tcp";
import "std/io";

// Simple protocol: PING -> PONG
type ProtocolServer struct {
    .listener: TcpListener
};

fn newProtocolServer(addr: str) -> str ! ProtocolServer {
    let listener := tcp::ListenTcp(addr) catch |err| err;
    return ProtocolServer{.listener: listener};
}

fn handleProtocol(conn: TcpConn) {
    io::Printf("Protocol client connected: {}\n", conn.remote);
    
    while true {
        let command := tcp::ReadLine(conn) catch |err| {
            io::Printf("Read error: {}\n", err);
            break;
        };
        
        let trimmed := command; // Would trim whitespace in real implementation
        
        if trimmed == "PING" {
            tcp::WriteLine(conn, "PONG") catch |err| {
                io::Printf("Write error: {}\n", err);
                break;
            };
        } else if trimmed == "QUIT" {
            tcp::WriteLine(conn, "BYE") catch |err| {};
            break;
        } else if trimmed == "TIME" {
            let timeStr := time::Now();
            tcp::WriteLine(conn, timeStr) catch |err| {
                io::Printf("Write error: {}\n", err);
                break;
            };
        } else {
            tcp::WriteLine(conn, "UNKNOWN COMMAND") catch |err| {
                io::Printf("Write error: {}\n", err);
                break;
            };
        }
    }
    
    tcp::CloseConn(conn);
    io::Printf("Protocol client disconnected: {}\n", conn.remote);
}

fn protocolClient(host: str, port: i32) {
    let address := host + ":" + (port as str);
    
    let conn := tcp::DialTcp(address) catch |err| {
        io::Printf("Connection failed: {}\n", err);
        return;
    };
    
    defer tcp::CloseConn(conn);
    
    // Send commands
    let commands := ["PING", "TIME", "PING", "QUIT"];
    
    for command in commands {
        io::Printf("Sending: %s\n", command);
        tcp::WriteLine(conn, command) catch |err| {
            io::Printf("Send error: {}\n", err);
            break;
        };
        
        let response := tcp::ReadLine(conn) catch |err| {
            io::Printf("Read error: {}\n", err);
            break;
        };
        
        io::Printf("Received: %s\n", response);
    }
}

fn main() {
    // This example shows both server and client
    // In practice, you'd run them separately
    
    io::Println("TCP Protocol Example");
    io::Println("Commands: PING -> PONG, TIME -> current time, QUIT -> BYE");
    
    // Start server (would run in background in real app)
    let server := newProtocolServer("127.0.0.1:8082") catch |err| {
        io::Printf("Server error: {}\n", err);
        return;
    };
    
    defer tcp::CloseListener(server.listener);
    
    io::Println("Protocol server started on 127.0.0.1:8082");
    
    // Accept one connection for demo
    let conn := tcp::Accept(server.listener) catch |err| {
        io::Printf("Accept error: {}\n", err);
        return;
    };
    
    handleProtocol(conn);
}
```

## Best Practices

1. **Always handle errors** - Network operations frequently fail
2. **Use `defer` for cleanup** - Ensure connections and listeners are closed
3. **Set timeouts** for network operations (not shown in this basic API)
4. **Handle partial reads/writes** - Network I/O may not transfer all data at once
5. **Validate input data** - Never trust data from network sources
6. **Use connection pooling** for clients making multiple requests
7. **Implement graceful shutdown** for servers
8. **Log connection events** for debugging and monitoring

## Security Considerations

- **Input validation**: Always validate and sanitize network input
- **Rate limiting**: Prevent abuse with connection and request limits
- **Access control**: Implement authentication and authorization
- **Encryption**: Use TLS for sensitive data (not provided by this module)
- **Resource limits**: Prevent memory exhaustion from large messages

## See Also

- [HTTP Module](/docs/stdlib/http) - Higher-level HTTP server and client
- [Error Handling](/docs/advanced/errors) - Handling network errors gracefully
- [Defer Statements](/docs/control-flow/defer) - Automatic resource cleanup
- [OS Module](/docs/stdlib/os) - Process and signal management for servers
