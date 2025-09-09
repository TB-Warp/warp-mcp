#!/bin/bash

# Test MCP LXC Server
echo "Testing LXC MCP Server..."

# Test 1: List tools
echo -e "\n=== Test 1: List available tools ==="
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node build/index.js 2>/dev/null | jq '.result.tools[].name'

# Test 2: List containers
echo -e "\n=== Test 2: List containers ==="
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "lxc_list", "arguments": {}}}' | node build/index.js 2>/dev/null | jq -r '.result.content[0].text' | head -20

# Test 3: Get container info
echo -e "\n=== Test 3: Get container info (mcp) ==="
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "lxc_info", "arguments": {"name": "mcp"}}}' | node build/index.js 2>/dev/null | jq -r '.result.content[0].text' | head -10

# Test 4: Execute command
echo -e "\n=== Test 4: Execute command in container ==="
echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "lxc_exec", "arguments": {"container": "mcp", "command": "uptime"}}}' | node build/index.js 2>/dev/null | jq -r '.result.content[0].text'

echo -e "\n✅ MCP Server test completed!"
