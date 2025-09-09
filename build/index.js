#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod";
// Shell escaping utility
function escapeShellArg(arg) {
    return "'" + arg.replace(/'/g, "'\"'\"'") + "'";
}
// Timeout wrapper for exec
function execWithTimeout(command, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
        const child = exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Command failed: ${error.message}`));
            }
            else {
                resolve({ stdout, stderr });
            }
        });
        const timeout = setTimeout(() => {
            child.kill('SIGTERM');
            reject(new Error(`Command timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        child.on('exit', () => {
            clearTimeout(timeout);
        });
    });
}
// LXC availability check
async function checkLXCAvailability() {
    try {
        const { stderr } = await execWithTimeout('lxc version', 5000);
        if (stderr && stderr.includes('daemon')) {
            throw new Error('LXD daemon not running');
        }
    }
    catch (error) {
        throw new Error(`LXC/LXD not available: ${error}. Please ensure LXC/LXD is installed and running.`);
    }
}
const execAsync = promisify(exec);
// Separate schema for stop container operation
const StopContainerSchema = z.object({
    name: z.string().describe("Container name to stop"),
    remote: z.string().optional().describe("Remote LXD server name (default: current)"),
    force: z.boolean().optional().default(false).describe("Force stop the container"),
});
// Define schemas for our tools
const ListContainersSchema = z.object({
    remote: z.string().optional().describe("Remote LXD server name (default: current)"),
});
const ContainerInfoSchema = z.object({
    name: z.string().describe("Container name"),
    remote: z.string().optional().describe("Remote LXD server name (default: current)"),
});
const ExecCommandSchema = z.object({
    container: z.string().describe("Container name"),
    command: z.string().describe("Command to execute"),
    remote: z.string().optional().describe("Remote LXD server name (default: current)"),
    interactive: z.boolean().optional().default(false).describe("Run in interactive mode"),
});
const LaunchContainerSchema = z.object({
    image: z.string().describe("Container image (e.g., ubuntu:22.04)"),
    name: z.string().optional().describe("Container name (auto-generated if not provided)"),
    remote: z.string().optional().describe("Remote LXD server name (default: current)"),
});
const DeleteContainerSchema = z.object({
    name: z.string().describe("Container name to delete"),
    remote: z.string().optional().describe("Remote LXD server name (default: current)"),
    force: z.boolean().optional().default(false).describe("Force deletion even if running"),
});
class LXCMCPServer {
    server;
    constructor() {
        this.server = new Server({
            name: "lxc-mcp-server",
            version: "1.0.0",
        });
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => console.error("[MCP Error]", error);
        process.on("SIGINT", async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "lxc_list",
                    description: "List all containers",
                    inputSchema: {
                        type: "object",
                        properties: {
                            remote: {
                                type: "string",
                                description: "Remote LXD server name (default: current)",
                            },
                        },
                    },
                },
                {
                    name: "lxc_info",
                    description: "Get detailed information about a container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Container name",
                            },
                            remote: {
                                type: "string",
                                description: "Remote LXD server name (default: current)",
                            },
                        },
                        required: ["name"],
                    },
                },
                {
                    name: "lxc_exec",
                    description: "Execute a command in a container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            container: {
                                type: "string",
                                description: "Container name",
                            },
                            command: {
                                type: "string",
                                description: "Command to execute",
                            },
                            remote: {
                                type: "string",
                                description: "Remote LXD server name (default: current)",
                            },
                            interactive: {
                                type: "boolean",
                                description: "Run in interactive mode",
                                default: false,
                            },
                        },
                        required: ["container", "command"],
                    },
                },
                {
                    name: "lxc_launch",
                    description: "Launch a new container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            image: {
                                type: "string",
                                description: "Container image (e.g., ubuntu:22.04)",
                            },
                            name: {
                                type: "string",
                                description: "Container name (auto-generated if not provided)",
                            },
                            remote: {
                                type: "string",
                                description: "Remote LXD server name (default: current)",
                            },
                        },
                        required: ["image"],
                    },
                },
                {
                    name: "lxc_delete",
                    description: "Delete a container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Container name to delete",
                            },
                            remote: {
                                type: "string",
                                description: "Remote LXD server name (default: current)",
                            },
                            force: {
                                type: "boolean",
                                description: "Force deletion even if running",
                                default: false,
                            },
                        },
                        required: ["name"],
                    },
                },
                {
                    name: "lxc_start",
                    description: "Start a container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Container name to start",
                            },
                            remote: {
                                type: "string",
                                description: "Remote LXD server name (default: current)",
                            },
                        },
                        required: ["name"],
                    },
                },
                {
                    name: "lxc_stop",
                    description: "Stop a container",
                    inputSchema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Container name to stop",
                            },
                            remote: {
                                type: "string",
                                description: "Remote LXD server name (default: current)",
                            },
                            force: {
                                type: "boolean",
                                description: "Force stop the container",
                                default: false,
                            },
                        },
                        required: ["name"],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case "lxc_list":
                        return await this.handleListContainers(args);
                    case "lxc_info":
                        return await this.handleContainerInfo(args);
                    case "lxc_exec":
                        return await this.handleExecCommand(args);
                    case "lxc_launch":
                        return await this.handleLaunchContainer(args);
                    case "lxc_delete":
                        return await this.handleDeleteContainer(args);
                    case "lxc_start":
                        return await this.handleStartContainer(args);
                    case "lxc_stop":
                        return await this.handleStopContainer(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
            }
        });
    }
    async handleListContainers(args) {
        const parsed = ListContainersSchema.parse(args);
        const remotePrefix = parsed.remote ? `${escapeShellArg(parsed.remote)}:` : "";
        const command = `lxc list ${remotePrefix}--format json`;
        const { stdout, stderr } = await execWithTimeout(command);
        if (stderr && stderr.trim()) {
            throw new McpError(ErrorCode.InternalError, `LXC error: ${stderr}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Containers:\n${stdout}`,
                },
            ],
        };
    }
    async handleContainerInfo(args) {
        const parsed = ContainerInfoSchema.parse(args);
        const remotePrefix = parsed.remote ? `${escapeShellArg(parsed.remote)}:` : "";
        const command = `lxc info ${remotePrefix}${escapeShellArg(parsed.name)}`;
        const { stdout, stderr } = await execWithTimeout(command);
        if (stderr && stderr.trim()) {
            throw new McpError(ErrorCode.InternalError, `LXC error: ${stderr}`);
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Container info for ${parsed.name}:\n${stdout}`,
                },
            ],
        };
    }
    async handleExecCommand(args) {
        const parsed = ExecCommandSchema.parse(args);
        const remotePrefix = parsed.remote ? `${escapeShellArg(parsed.remote)}:` : "";
        const interactiveFlag = parsed.interactive ? "-t" : "";
        const command = `lxc exec ${remotePrefix}${escapeShellArg(parsed.container)} ${interactiveFlag} -- ${escapeShellArg(parsed.command)}`;
        const { stdout, stderr } = await execWithTimeout(command);
        return {
            content: [
                {
                    type: "text",
                    text: `Command output:\n${stdout}\n${stderr ? `Errors:\n${stderr}` : ""}`,
                },
            ],
        };
    }
    async handleLaunchContainer(args) {
        const parsed = LaunchContainerSchema.parse(args);
        const imageArg = escapeShellArg(parsed.image);
        const nameArg = parsed.name ? ` ${escapeShellArg(parsed.name)}` : "";
        const remoteArg = parsed.remote ? ` --remote=${escapeShellArg(parsed.remote)}` : "";
        const command = `lxc launch ${imageArg}${nameArg}${remoteArg}`;
        const { stdout, stderr } = await execWithTimeout(command);
        return {
            content: [
                {
                    type: "text",
                    text: `Launch result:\n${stdout}\n${stderr ? `Warnings:\n${stderr}` : ""}`,
                },
            ],
        };
    }
    async handleDeleteContainer(args) {
        const parsed = DeleteContainerSchema.parse(args);
        const remotePrefix = parsed.remote ? `${escapeShellArg(parsed.remote)}:` : "";
        const forceFlag = parsed.force ? "--force" : "";
        const command = `lxc delete ${remotePrefix}${escapeShellArg(parsed.name)} ${forceFlag}`;
        const { stdout, stderr } = await execWithTimeout(command);
        return {
            content: [
                {
                    type: "text",
                    text: `Delete result:\n${stdout}\n${stderr ? `Warnings:\n${stderr}` : ""}`,
                },
            ],
        };
    }
    async handleStartContainer(args) {
        const parsed = ContainerInfoSchema.parse(args);
        const remotePrefix = parsed.remote ? `${escapeShellArg(parsed.remote)}:` : "";
        const command = `lxc start ${remotePrefix}${escapeShellArg(parsed.name)}`;
        const { stdout, stderr } = await execWithTimeout(command);
        return {
            content: [
                {
                    type: "text",
                    text: `Start result:\n${stdout}\n${stderr ? `Warnings:\n${stderr}` : ""}`,
                },
            ],
        };
    }
    async handleStopContainer(args) {
        const parsed = StopContainerSchema.parse(args);
        const remotePrefix = parsed.remote ? `${escapeShellArg(parsed.remote)}:` : "";
        const forceFlag = parsed.force ? "--force" : "";
        const command = `lxc stop ${remotePrefix}${escapeShellArg(parsed.name)} ${forceFlag}`;
        const { stdout, stderr } = await execWithTimeout(command);
        return {
            content: [
                {
                    type: "text",
                    text: `Stop result:\n${stdout}\n${stderr ? `Warnings:\n${stderr}` : ""}`,
                },
            ],
        };
    }
    async run() {
        // Check LXC availability at startup
        try {
            await checkLXCAvailability();
        }
        catch (error) {
            console.error(`Startup failed: ${error}`);
            process.exit(1);
        }
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error("LXC MCP server running on stdio");
    }
}
const server = new LXCMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map