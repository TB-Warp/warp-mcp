# LXC MCP Server

En MCP (Model Context Protocol) server der giver adgang til LXC/LXD container management gennem AI-assistenter som Warp.

## Features

Denne MCP server understøtter følgende LXC/LXD operationer:

- **lxc_list** - List alle containers
- **lxc_info** - Få detaljeret information om en container
- **lxc_exec** - Kør kommandoer i en container
- **lxc_launch** - Opret og start en ny container
- **lxc_start** - Start en container
- **lxc_stop** - Stop en container
- **lxc_delete** - Slet en container

Alle operationer understøtter remote LXD servere via `remote` parameteren.

## Installation

1. Klon eller download dette repository
2. Installer dependencies:
```bash
npm install
```

3. Byg projektet:
```bash
npm run build
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

### Brug med Warp AI

For at bruge denne MCP server med Warp AI, skal du tilføje den til din Warp konfiguration:

1. Åbn Warp settings
2. Gå til MCP Servers
3. Tilføj en ny server:
   - **Name**: `lxc-mcp-server`
   - **Command**: `node`
   - **Arguments**: `["/path/to/lxc-mcp/build/index.js"]`
   - **Environment**: `{}`

## Eksempel kommandoer

### List containers
```json
{
  "name": "lxc_list",
  "arguments": {
    "remote": "mimer"  // Valgfri - standard er current remote
  }
}
```

### Få container info
```json
{
  "name": "lxc_info",
  "arguments": {
    "name": "mcp",
    "remote": "mimer"  // Valgfri
  }
}
```

### Kør kommando i container
```json
{
  "name": "lxc_exec",
  "arguments": {
    "container": "mcp",
    "command": "ls -la /home",
    "remote": "mimer",      // Valgfri
    "interactive": false    // Valgfri, default false
  }
}
```

### Launch ny container
```json
{
  "name": "lxc_launch",
  "arguments": {
    "image": "ubuntu:22.04",
    "name": "test-container",  // Valgfri - auto-genereret hvis ikke angivet
    "remote": "mimer"          // Valgfri
  }
}
```

### Start container
```json
{
  "name": "lxc_start",
  "arguments": {
    "name": "test-container",
    "remote": "mimer"  // Valgfri
  }
}
```

### Stop container
```json
{
  "name": "lxc_stop",
  "arguments": {
    "name": "test-container",
    "remote": "mimer",  // Valgfri
    "force": false      // Valgfri, default false
  }
}
```

### Slet container
```json
{
  "name": "lxc_delete",
  "arguments": {
    "name": "test-container",
    "remote": "mimer",  // Valgfri
    "force": true       // Valgfri, default false - tvangsslet selv hvis kørende
  }
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
