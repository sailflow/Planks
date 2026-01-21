# MCP Server Setup for @sailflow/planks

This component library includes a Model Context Protocol (MCP) server that allows AI assistants to discover and use components programmatically.

## What is MCP?

The Model Context Protocol (MCP) is a standard for exposing resources and tools to AI assistants. The `@sailflow/planks` MCP server provides:

- **Component Discovery**: List all available components by category
- **Component Metadata**: Get props, variants, and type information
- **Usage Examples**: Generate code examples for any component
- **Tailwind Configuration**: Access the library's Tailwind config

## Setup with Claude Desktop

1. **Install the package** (if not already installed):
   ```bash
   npm install @sailflow/planks
   # or
   bun add @sailflow/planks
   ```

2. **Configure Claude Desktop**:
   
   Edit your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

3. **Add the MCP server**:
   ```json
   {
     "mcpServers": {
       "planks": {
         "command": "node",
         "args": [
           "/path/to/node_modules/@sailflow/planks/dist/mcp/server.js"
         ]
       }
     }
   }
   ```

   Replace `/path/to/node_modules` with the actual path to your project's `node_modules` directory.

4. **Restart Claude Desktop** to load the MCP server.

## Using the MCP Server

Once configured, you can ask Claude to:

- **List components**: "What components are available in planks?"
- **Get component details**: "Show me the Button component from planks"
- **Generate examples**: "How do I use the Card component from planks?"
- **Search components**: "Search for form components in planks"

## Available Resources

The MCP server exposes the following resources:

### Component List
- **URI**: `planks://components/list`
- **Description**: List all components organized by category
- **Returns**: JSON with component names and categories

### Component Details
- **URI**: `planks://components/{name}`
- **Description**: Get detailed metadata for a specific component
- **Returns**: JSON with props, variants, source code, and usage examples

### Component Examples
- **URI**: `planks://examples/{name}`
- **Description**: Get a usage example for a specific component
- **Returns**: TypeScript/React code example

### Tailwind Configuration
- **URI**: `planks://config/tailwind`
- **Description**: Get the Tailwind CSS configuration
- **Returns**: JSON with config and CSS variable information

## Available Tools

The MCP server also provides tools for interactive queries:

### search_components
Search for components by name or category.

**Parameters**:
- `query` (string): Search query (component name or category)

**Example**:
```json
{
  "query": "button"
}
```

### get_component_info
Get detailed information about a specific component.

**Parameters**:
- `name` (string): Component name (e.g., "button", "card")

**Example**:
```json
{
  "name": "button"
}
```

## Testing the Server

You can test the MCP server locally using the MCP Inspector:

```bash
# Install the MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Run the inspector
npx @modelcontextprotocol/inspector node dist/mcp/server.js
```

This will open a web interface where you can:
- Browse available resources
- Test resource URIs
- Call tools with different parameters
- View responses in real-time

## Using with Other MCP Clients

The server works with any MCP-compatible client. The general setup is:

1. Run the server: `node /path/to/@sailflow/planks/dist/mcp/server.js`
2. The server communicates via stdio (standard input/output)
3. Send MCP protocol messages to interact with the server

## Troubleshooting

### Server not appearing in Claude Desktop

1. Check that the path to `cli.mjs` is correct (it should point to the published package in `node_modules`)
2. Ensure Node.js is installed and accessible
3. Check Claude Desktop logs for errors:
   - **macOS**: `~/Library/Logs/Claude/mcp.log`
   - **Windows**: `%APPDATA%\Claude\logs\mcp.log`
4. Restart Claude Desktop after configuration changes

### Components not being found

The MCP server needs access to the source files in `src/components`. Make sure:
- The package is fully installed (including source files)
- The file structure is intact
- You're using the published version of the package

### Permission errors

On Unix systems, you may need to make the CLI wrapper executable:
```bash
chmod +x node_modules/@sailflow/planks/dist/mcp/cli.mjs
```

## Development

If you're developing the component library and want to test the MCP server:

```bash
# Build the library and MCP server
bun run build

# Run the MCP server
bun run mcp

# Or test with the inspector
npx @modelcontextprotocol/inspector bun run mcp
```
