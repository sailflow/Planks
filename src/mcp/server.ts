#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { listResources, getResource } from './resources.js';
import { getAllComponents, getComponent } from './components.js';

/**
 * MCP Server for @sailflow/planks component library
 * 
 * Exposes component metadata, usage examples, and configuration
 * to AI assistants via the Model Context Protocol.
 */
class PlanksServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: '@sailflow/planks',
                version: '0.0.1',
            },
            {
                capabilities: {
                    resources: {},
                    tools: {},
                },
            }
        );

        this.setupHandlers();
        this.setupErrorHandling();
    }

    private setupHandlers() {
        // List available resources
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const resources = listResources();
            return {
                resources: resources.map((r) => ({
                    uri: r.uri,
                    name: r.name,
                    description: r.description,
                    mimeType: r.mimeType,
                })),
            };
        });

        // Read a specific resource
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const uri = request.params.uri;
            const content = getResource(uri);

            if (!content) {
                throw new Error(`Resource not found: ${uri}`);
            }

            return {
                contents: [
                    {
                        uri,
                        mimeType: uri.includes('/examples/') ? 'text/plain' : 'application/json',
                        text: content,
                    },
                ],
            };
        });

        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'search_components',
                        description: 'Search for components by name or category',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Search query (component name or category)',
                                },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'get_component_info',
                        description: 'Get detailed information about a specific component',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Component name (e.g., "button", "card")',
                                },
                            },
                            required: ['name'],
                        },
                    },
                ],
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            if (name === 'search_components') {
                const query = (args as { query: string }).query.toLowerCase();
                const allComponents = getAllComponents();
                const results: any[] = [];

                // Search by category
                if (allComponents[query]) {
                    results.push({
                        category: query,
                        components: allComponents[query].map((c) => c.name),
                    });
                }

                // Search by component name
                for (const [category, components] of Object.entries(allComponents)) {
                    const matches = components.filter((c) =>
                        c.name.toLowerCase().includes(query)
                    );
                    if (matches.length > 0) {
                        results.push({
                            category,
                            components: matches.map((c) => c.name),
                        });
                    }
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(results, null, 2),
                        },
                    ],
                };
            }

            if (name === 'get_component_info') {
                const componentName = (args as { name: string }).name;
                const component = getComponent(componentName);

                if (!component) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Component '${componentName}' not found`,
                            },
                        ],
                    };
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(component, null, 2),
                        },
                    ],
                };
            }

            throw new Error(`Unknown tool: ${name}`);
        });
    }

    private setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };

        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('@sailflow/planks MCP server running on stdio');
    }
}

// Start the server
const server = new PlanksServer();
server.run().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
