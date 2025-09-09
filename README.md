# LXC MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)

En professionel MCP (Model Context Protocol) server der giver seamless adgang til LXC/LXD container management gennem AI-assistenter som Warp Terminal.

## 🚀 Quick Start

### Installation via Homebrew (Anbefalet)

```bash
# Add tap (første gang)
brew tap lpm/lxc-mcp https://github.com/lpm/homebrew-lxc-mcp

# Install
brew install lxc-mcp-server

# Verificer installation
lxc-mcp-server --help
```

### Test installation
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | lxc-mcp-server
```

## ✨ Features

Denne MCP server leverer komplet LXC/LXD container management:

### Core Operations
- 🔍 **lxc_list** - List alle containers med detaljeret status
- 📊 **lxc_info** - Komplet container information (RAM, CPU, netværk)
- ⚡ **lxc_exec** - Kør kommandoer i containers (interaktiv support)
- 🚀 **lxc_launch** - Opret og start nye containers
- ▶️ **lxc_start** - Start stoppede containers
- ⏹️ **lxc_stop** - Stop kørende containers (graceful/force)
- 🗑️ **lxc_delete** - Slet containers (med force option)

### Advanced Features
- 🌐 **Remote LXD Support** - Administrer containers på remote servere
- 🔗 **Tailscale Integration** - Virker perfekt med Tailscale netværk
- 🛡️ **Type Safety** - Bygget med TypeScript for maksimal sikkerhed
- 🎯 **Warp AI Integration** - Optimeret til Warp Terminal's Agent Mode
- ⚡ **High Performance** - Asynkron JSON-RPC kommunikation

## 📬 Installation

### 🍺 Homebrew (Anbefalet - macOS)

Den nemmeste og mest professionelle måde:

```bash
# Første gang: Add custom tap
brew tap lpm/lxc-mcp https://github.com/lpm/homebrew-lxc-mcp

# Install LXC MCP Server
brew install lxc-mcp-server

# Verificer installation
lxc-mcp-server --help
which lxc-mcp-server  # -> /usr/local/bin/lxc-mcp-server
```

**Homebrew fordele:**
- ✅ Automatisk dependency management
- ✅ System PATH integration 
- ✅ Nem opdatering med `brew upgrade lxc-mcp-server`
- ✅ Clean uninstall med `brew uninstall lxc-mcp-server`

### 📦 NPM Global (Udvikling)

```bash
# Klon repository
git clone https://github.com/lpm/lxc-mcp.git
cd lxc-mcp

# Install og byg
npm install
npm run build

# Install globalt
npm install -g .

# Nu tilgængelig som: lxc-mcp-server
```

### 🚀 Direkte fra kilde (Advanced)

```bash
# Klon og byg
git clone https://github.com/lpm/lxc-mcp.git
cd lxc-mcp
npm install
npm run build

# Kør direkte
node build/index.js
```

## Brug

### Direkte test via JSON-RPC

Du kan teste serveren direkte via JSON-RPC over stdio:

```bash
# List alle tilgængelige tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node build/index.js

# List alle containers
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "lxc_list", "arguments": {}}}' | node build/index.js

# Kør en kommando i en container
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "lxc_exec", "arguments": {"container": "mcp", "command": "hostname"}}}' | node build/index.js
```

### 🔧 Warp AI Integration

### Quick Setup

1. **Åbn Warp Terminal**
2. **Gå til Settings** ➜ `Cmd+,` 
3. **Find "Agent Mode" eller "MCP Servers"**
4. **Add New MCP Server**:

```json
{
  "mcpServers": {
    "lxc-mcp": {
      "command": "lxc-mcp",
      "args": []
    }
  }
}
```

**Alternative med old name:**
```json
{
  "mcpServers": {
    "lxc-mcp-server": {
      "command": "lxc-mcp-server",
      "args": []
    }
  }
}
```

### Alternative Konfigurationer

**Homebrew installation (new name):**
```json
{
  "command": "lxc-mcp",
  "args": []
}
```

**NPM global (new name):**
```json
{
  "command": "lxc-mcp", 
  "args": []
}
```

**Legacy name support:**
```json
{
  "command": "lxc-mcp-server",
  "args": []
}
```

**Direkte node:**
```json
{
  "command": "node",
  "args": ["/usr/local/lib/lxc-mcp/build/index.js"]
}
```

### 🎨 Warp AI Usage Examples

Når MCP serveren er konfigureret, kan du bruge naturligt sprog i Warp:

```
👤 User: "List mine LXC containers"
🤖 AI: Lists all containers med status, IP-adresser og ressourceforbrug

👤 User: "Run 'ps aux' in the mcp container" 
🤖 AI: Kører ps aux kommandoen i mcp containeren

👤 User: "Show me detailed info about llmgateway container"
🤖 AI: Viser CPU, RAM, netværk og disk stats for llmgateway

👤 User: "Create a new Ubuntu 22.04 container called test"
🤖 AI: Opretter og starter en ny container med Ubuntu 22.04
```

## 📚 API Reference

### 🔍 lxc_list - List Containers

List alle containers med komplet status information.

**Parameters:**
```typescript
{
  remote?: string  // Remote LXD server navn (valgfri)
}
```

**Eksempel:**
```json
{
  "name": "lxc_list",
  "arguments": {
    "remote": "mimer"
  }
}
```

**Response:** Detaljeret JSON med container status, IP-adresser, RAM/CPU forbrug, netværksstatistik.

### 📊 lxc_info - Container Information

Få detaljeret information om en specifik container.

**Parameters:**
```typescript
{
  name: string,      // Container navn (påkrævet)
  remote?: string    // Remote server (valgfri)
}
```

**Eksempel:**
```json
{
  "name": "lxc_info",
  "arguments": {
    "name": "mcp",
    "remote": "mimer"
  }
}
```

**Response:** CPU usage, RAM stats, netværksinterfaces, disk usage, PID, uptime.

### ⚡ lxc_exec - Execute Commands

Kør kommandoer inde i en container.

**Parameters:**
```typescript
{
  container: string,    // Container navn (påkrævet)
  command: string,      // Kommando at køre (påkrævet)
  remote?: string,      // Remote server (valgfri)
  interactive?: boolean // Interaktiv mode (default: false)
}
```

**Eksempel:**
```json
{
  "name": "lxc_exec",
  "arguments": {
    "container": "mcp",
    "command": "ls -la /home",
    "remote": "mimer",
    "interactive": false
  }
}
```

**Response:** Command output (stdout + stderr).

### 🚀 lxc_launch - Create Container

Opret og start en ny container fra et image.

**Parameters:**
```typescript
{
  image: string,     // Container image (påkrævet) f.eks. "ubuntu:22.04"
  name?: string,     // Container navn (auto-genereret hvis ikke angivet)
  remote?: string    // Remote server (valgfri)
}
```

**Eksempel:**
```json
{
  "name": "lxc_launch",
  "arguments": {
    "image": "ubuntu:22.04",
    "name": "test-container",
    "remote": "mimer"
  }
}
```

### ▶️ lxc_start - Start Container

**Parameters:**
```typescript
{
  name: string,      // Container navn (påkrævet)
  remote?: string    // Remote server (valgfri)
}
```

### ⏹️ lxc_stop - Stop Container

**Parameters:**
```typescript
{
  name: string,      // Container navn (påkrævet)
  remote?: string,   // Remote server (valgfri)
  force?: boolean    // Force stop (default: false)
}
```

### 🗑️ lxc_delete - Delete Container

**Parameters:**
```typescript
{
  name: string,      // Container navn (påkrævet)
  remote?: string,   // Remote server (valgfri) 
  force?: boolean    // Force delete hvis kørende (default: false)
}
```

## Forudsætninger

- Node.js 18+
- LXC/LXD installeret og konfigureret
- Adgang til LXD server (lokalt eller remote)

## Udvikling

```bash
# Watch mode for udvikling
npm run dev

# Build projektet
npm run build

# Start serveren
npm start
```

## Sikkerhed

**Vigtig**: Denne MCP server kan køre vilkårlige kommandoer på dine containere. Brug kun i miljøer hvor du stoler på AI-assistenten og dens input.

## Licens

MIT
