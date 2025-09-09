#!/bin/bash
set -e

echo "🚀 Installing LXC MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js first: brew install node"
    exit 1
fi

# Install method selection
echo "Choose installation method:"
echo "1) Global npm installation (recommended for development)"
echo "2) System-wide installation (/usr/local/lib)"
echo "3) macOS Application Bundle (~/Applications)"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "📦 Installing globally via npm..."
        npm install -g .
        echo "✅ Installed! Use: lxc-mcp-server"
        ;;
    2)
        echo "🔧 Installing system-wide..."
        sudo mkdir -p /usr/local/lib/lxc-mcp
        sudo cp -r build node_modules package.json /usr/local/lib/lxc-mcp/
        
        cat > /tmp/lxc-mcp-wrapper << 'EOF'
#!/bin/bash
exec node /usr/local/lib/lxc-mcp/build/index.js "$@"
EOF
        
        sudo mv /tmp/lxc-mcp-wrapper /usr/local/bin/lxc-mcp-server
        sudo chmod +x /usr/local/bin/lxc-mcp-server
        echo "✅ Installed! Use: lxc-mcp-server"
        ;;
    3)
        echo "📱 Creating macOS Application Bundle..."
        mkdir -p ~/Applications/LXC-MCP-Server.app/Contents/{MacOS,Resources}
        
        cp -r build node_modules package.json ~/Applications/LXC-MCP-Server.app/Contents/Resources/
        
        # Create Info.plist
        cat > ~/Applications/LXC-MCP-Server.app/Contents/Info.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>lxc-mcp-server</string>
    <key>CFBundleIdentifier</key>
    <string>com.lpm.lxc-mcp-server</string>
    <key>CFBundleName</key>
    <string>LXC MCP Server</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF
        
        # Create executable
        cat > ~/Applications/LXC-MCP-Server.app/Contents/MacOS/lxc-mcp-server << 'EOF'
#!/bin/bash
BUNDLE_DIR="$(dirname "$0")/.."
RESOURCES_DIR="$BUNDLE_DIR/Resources"
exec node "$RESOURCES_DIR/build/index.js" "$@"
EOF
        
        chmod +x ~/Applications/LXC-MCP-Server.app/Contents/MacOS/lxc-mcp-server
        
        # Create symlink for command line access
        ln -sf ~/Applications/LXC-MCP-Server.app/Contents/MacOS/lxc-mcp-server /usr/local/bin/lxc-mcp-server-app
        
        echo "✅ Installed! Use: ~/Applications/LXC-MCP-Server.app/Contents/MacOS/lxc-mcp-server"
        echo "   Or: lxc-mcp-server-app"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 LXC MCP Server installation complete!"
echo ""
echo "Configuration for Warp:"
echo '{"mcpServers": {"lxc-mcp-server": {"command": "lxc-mcp-server", "args": []}}}'
echo ""
echo "Test installation:"
echo 'echo \'{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}\' | lxc-mcp-server'
