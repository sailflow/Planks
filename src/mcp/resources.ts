import {
    getAllComponents,
    getComponent,
    getComponentSource,
    generateUsageExample,
    type ComponentMetadata,
} from './components.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ResourceHandler {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    handler: () => string;
}

/**
 * List all available MCP resources
 */
export function listResources(): ResourceHandler[] {
    const resources: ResourceHandler[] = [
        {
            uri: 'planks://components/list',
            name: 'Component List',
            description: 'List all available components organized by category',
            mimeType: 'application/json',
            handler: handleComponentList,
        },
        {
            uri: 'planks://config/tailwind',
            name: 'Tailwind Configuration',
            description: 'Get the Tailwind CSS configuration used by the component library',
            mimeType: 'application/json',
            handler: handleTailwindConfig,
        },
    ];

    // Add individual component resources
    const allComponents = getAllComponents();
    for (const category of Object.keys(allComponents)) {
        for (const component of allComponents[category]) {
            resources.push({
                uri: `planks://components/${component.name}`,
                name: `${component.name} Component`,
                description: `Metadata and usage information for the ${component.name} component`,
                mimeType: 'application/json',
                handler: () => handleComponentDetail(component.name),
            });

            resources.push({
                uri: `planks://examples/${component.name}`,
                name: `${component.name} Example`,
                description: `Usage example for the ${component.name} component`,
                mimeType: 'text/plain',
                handler: () => handleComponentExample(component.name),
            });
        }
    }

    return resources;
}

/**
 * Get a resource by URI
 */
export function getResource(uri: string): string | null {
    const resources = listResources();
    const resource = resources.find((r) => r.uri === uri);

    if (!resource) {
        return null;
    }

    try {
        return resource.handler();
    } catch (error) {
        console.error(`Error handling resource ${uri}:`, error);
        return null;
    }
}

/**
 * Handle component list request
 */
function handleComponentList(): string {
    const components = getAllComponents();

    const summary = {
        totalComponents: Object.values(components).reduce((sum, cat) => sum + cat.length, 0),
        categories: Object.keys(components),
        components: Object.entries(components).map(([category, items]) => ({
            category,
            count: items.length,
            components: items.map((c) => ({
                name: c.name,
                description: c.description,
                hasVariants: !!c.variants,
            })),
        })),
    };

    return JSON.stringify(summary, null, 2);
}

/**
 * Handle component detail request
 */
function handleComponentDetail(name: string): string {
    const component = getComponent(name);

    if (!component) {
        return JSON.stringify({ error: `Component '${name}' not found` }, null, 2);
    }

    const source = getComponentSource(name);
    const example = generateUsageExample(name);

    const detail = {
        name: component.name,
        category: component.category,
        description: component.description,
        props: component.props,
        variants: component.variants,
        source,
        example,
        usage: {
            import: `import { ${component.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} } from '@sailflow/planks';`,
            styles: `import '@sailflow/planks/styles.css';`,
        },
    };

    return JSON.stringify(detail, null, 2);
}

/**
 * Handle component example request
 */
function handleComponentExample(name: string): string {
    const example = generateUsageExample(name);

    if (!example) {
        return `// Component '${name}' not found`;
    }

    return example;
}

/**
 * Handle Tailwind config request
 */
function handleTailwindConfig(): string {
    try {
        const configPath = path.join(__dirname, '../../tailwind.config.ts');
        const configContent = fs.readFileSync(configPath, 'utf-8');

        return JSON.stringify({
            description: 'Tailwind CSS configuration for @sailflow/planks',
            note: 'This library uses CSS variables for theming. Import the styles.css file to use the components.',
            config: configContent,
            cssVariables: {
                colors: [
                    '--background',
                    '--foreground',
                    '--primary',
                    '--primary-foreground',
                    '--secondary',
                    '--secondary-foreground',
                    '--muted',
                    '--muted-foreground',
                    '--accent',
                    '--accent-foreground',
                    '--destructive',
                    '--destructive-foreground',
                    '--border',
                    '--input',
                    '--ring',
                ],
                radius: '--radius',
            },
        }, null, 2);
    } catch (error) {
        return JSON.stringify({ error: 'Failed to read Tailwind config' }, null, 2);
    }
}
