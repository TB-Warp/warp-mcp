class LxcMcp < Formula
  desc "Professional MCP server for LXC/LXD container management - seamless AI integration with Warp Terminal"
  homepage "https://github.com/TB-Warp/lxc-mcp"
  url "https://github.com/TB-Warp/lxc-mcp/archive/refs/heads/main.zip"
  version "1.0.1"
  sha256 "" # Will be calculated automatically by brew
  
  depends_on "node"
  depends_on "lxd" => :recommended

  def install
    # Install Node.js dependencies
    system "npm", "install", "--production"
    
    # Build TypeScript
    system "npm", "run", "build"
    
    # Install to libexec to avoid conflicts
    libexec.install Dir["*"]
    
    # Create wrapper scripts for both command names
    (bin/"lxc-mcp").write_env_script("#{Formula["node"].opt_bin}/node", 
                                     "#{libexec}/build/index.js")
    (bin/"lxc-mcp-server").write_env_script("#{Formula["node"].opt_bin}/node", 
                                           "#{libexec}/build/index.js")
  end

  def caveats
    <<~EOS
      LXC MCP Server requires LXD to be installed and running:
        
        # Install LXD if not already installed
        brew install --cask lxd
        
        # Initialize LXD (if first time)
        lxd init
        
        # Verify LXD is running
        lxc version
        
      To use with Warp AI, add to your MCP configuration:
      {
        "mcpServers": {
          "lxc-mcp": {
            "command": "lxc-mcp",
            "args": []
          }
        }
      }
      
      Both command names are available:
      - lxc-mcp (recommended for AI integration)
      - lxc-mcp-server (legacy compatibility)
    EOS
  end

  test do
    # Test that the server can start and list tools
    output = shell_output("echo '{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\", \"params\": {}}' | #{bin}/lxc-mcp 2>/dev/null", 0)
    assert_match "lxc_list", output
    assert_match "lxc_exec", output
    assert_match "lxc_launch", output
    
    # Test legacy name as well
    output2 = shell_output("echo '{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\", \"params\": {}}' | #{bin}/lxc-mcp-server 2>/dev/null", 0)
    assert_match "lxc_info", output2
  end
end
