import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ComponentMetadata {
    name: string;
    category: string;
    filePath: string;
    description?: string;
    props?: string[];
    variants?: Record<string, string[]>;
}

const COMPONENT_CATEGORIES = [
    'primitives',
    'layout',
    'forms',
    'data-display',
    'feedback',
    'navigation',
    'theme',
] as const;

/**
 * Get all components organized by category
 */
export function getAllComponents(): Record<string, ComponentMetadata[]> {
    const componentsDir = path.join(__dirname, '../components');
    const componentsByCategory: Record<string, ComponentMetadata[]> = {};

    for (const category of COMPONENT_CATEGORIES) {
        const categoryDir = path.join(componentsDir, category);

        if (!fs.existsSync(categoryDir)) {
            continue;
        }

        const files = fs.readdirSync(categoryDir);
        const components: ComponentMetadata[] = [];

        for (const file of files) {
            if (file.endsWith('.tsx') && file !== 'index.tsx') {
                const componentName = file.replace('.tsx', '');
                const filePath = path.join(categoryDir, file);

                components.push({
                    name: componentName,
                    category,
                    filePath,
                    ...extractComponentMetadata(filePath),
                });
            }
        }

        if (components.length > 0) {
            componentsByCategory[category] = components;
        }
    }

    return componentsByCategory;
}

/**
 * Get a specific component by name
 */
export function getComponent(name: string): ComponentMetadata | null {
    const allComponents = getAllComponents();

    for (const category of Object.keys(allComponents)) {
        const component = allComponents[category].find(
            (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        if (component) {
            return component;
        }
    }

    return null;
}

/**
 * Extract metadata from component source code
 */
function extractComponentMetadata(filePath: string): Partial<ComponentMetadata> {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const metadata: Partial<ComponentMetadata> = {};

        // Extract props interface
        const propsMatch = content.match(/export interface (\w+Props)[^{]*{([^}]+)}/s);
        if (propsMatch) {
            const propsContent = propsMatch[2];
            const props = propsContent
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith('//') && !line.startsWith('*'))
                .map((line) => line.split(':')[0]?.replace('?', '').trim())
                .filter(Boolean);
            metadata.props = props;
        }

        // Extract variants from CVA
        const variantsMatch = content.match(/variants:\s*{([^}]+)}/s);
        if (variantsMatch) {
            const variantsContent = variantsMatch[1];
            const variants: Record<string, string[]> = {};

            // Simple extraction - could be improved with proper AST parsing
            const variantMatches = variantsContent.matchAll(/(\w+):\s*{([^}]+)}/g);
            for (const match of variantMatches) {
                const variantName = match[1];
                const variantOptions = match[2];
                const options = variantOptions
                    .split('\n')
                    .map((line) => line.trim().split(':')[0])
                    .filter((opt) => opt && opt !== '');
                variants[variantName] = options;
            }

            if (Object.keys(variants).length > 0) {
                metadata.variants = variants;
            }
        }

        // Extract JSDoc description
        const descMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n\s*\*\//);
        if (descMatch) {
            metadata.description = descMatch[1];
        }

        return metadata;
    } catch (error) {
        console.error(`Error extracting metadata from ${filePath}:`, error);
        return {};
    }
}

/**
 * Get component source code
 */
export function getComponentSource(name: string): string | null {
    const component = getComponent(name);
    if (!component) {
        return null;
    }

    try {
        return fs.readFileSync(component.filePath, 'utf-8');
    } catch (error) {
        console.error(`Error reading component source:`, error);
        return null;
    }
}

/**
 * Generate usage example for a component
 */
export function generateUsageExample(name: string): string | null {
    const component = getComponent(name);
    if (!component) {
        return null;
    }

    const componentName = component.name
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

    // Generate basic example based on component type
    let example = `import { ${componentName} } from '@sailflow/planks';\nimport '@sailflow/planks/styles.css';\n\n`;

    if (component.category === 'primitives') {
        if (component.name === 'button') {
            example += `export default function Example() {\n  return (\n    <${componentName} variant="default" size="default">\n      Click me\n    </${componentName}>\n  );\n}`;
        } else if (component.name === 'input') {
            example += `export default function Example() {\n  return <${componentName} type="text" placeholder="Enter text..." />;\n}`;
        } else if (component.name === 'checkbox') {
            example += `export default function Example() {\n  return <${componentName} id="terms" />;\n}`;
        } else {
            example += `export default function Example() {\n  return <${componentName} />;\n}`;
        }
    } else if (component.category === 'layout') {
        if (component.name === 'card') {
            example += `import { CardContent, CardHeader, CardTitle } from '@sailflow/planks';\n\nexport default function Example() {\n  return (\n    <${componentName}>\n      <CardHeader>\n        <CardTitle>Card Title</CardTitle>\n      </CardHeader>\n      <CardContent>\n        Card content goes here\n      </CardContent>\n    </${componentName}>\n  );\n}`;
        } else {
            example += `export default function Example() {\n  return (\n    <${componentName}>\n      Content goes here\n    </${componentName}>\n  );\n}`;
        }
    } else if (component.category === 'forms') {
        if (component.name === 'form') {
            example += `import { useForm } from 'react-hook-form';\nimport { zodResolver } from '@hookform/resolvers/zod';\nimport * as z from 'zod';\nimport { Button, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, Input } from '@sailflow/planks';\n\nconst formSchema = z.object({\n  username: z.string().min(2, {\n    message: "Username must be at least 2 characters.",\n  }),\n});\n\nexport default function Example() {\n  const form = useForm<z.infer<typeof formSchema>>({\n    resolver: zodResolver(formSchema),\n    defaultValues: {\n      username: "",\n    },\n  });\n\n  function onSubmit(values: z.infer<typeof formSchema>) {\n    console.log(values);\n  }\n\n  return (\n    <Form {...form}>\n      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">\n        <FormField\n          control={form.control}\n          name="username"\n          render={({ field }) => (\n            <FormItem>\n              <FormLabel>Username</FormLabel>\n              <FormControl>\n                <Input placeholder="shadcn" {...field} />\n              </FormControl>\n              <FormDescription>\n                This is your public display name.\n              </FormDescription>\n              <FormMessage />\n            </FormItem>\n          )}\n        />\n        <Button type="submit">Submit</Button>\n      </form>\n    </Form>\n  );\n}`;
        } else {
            example += `export default function Example() {\n  return <${componentName} />;\n}`;
        }
    } else if (component.category === 'navigation') {
        if (component.name === 'tabs') {
            example += `import { Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Input, Button } from '@sailflow/planks';\n\nexport default function Example() {\n  return (\n    <Tabs defaultValue="account" className="w-[400px]">\n      <TabsList className="grid w-full grid-cols-2">\n        <TabsTrigger value="account">Account</TabsTrigger>\n        <TabsTrigger value="password">Password</TabsTrigger>\n      </TabsList>\n      <TabsContent value="account">\n        <Card>\n          <CardHeader>\n            <CardTitle>Account</CardTitle>\n            <CardDescription>\n              Make changes to your account here. Click save when you're done.\n            </CardDescription>\n          </CardHeader>\n          <CardContent className="space-y-2">\n            <div className="space-y-1">\n              <Label htmlFor="name">Name</Label>\n              <Input id="name" defaultValue="Pedro Duarte" />\n            </div>\n            <div className="space-y-1">\n              <Label htmlFor="username">Username</Label>\n              <Input id="username" defaultValue="@peduarte" />\n            </div>\n          </CardContent>\n        </Card>\n      </TabsContent>\n      <TabsContent value="password">\n        <Card>\n          <CardHeader>\n            <CardTitle>Password</CardTitle>\n            <CardDescription>\n              Change your password here. After saving, you'll be logged out.\n            </CardDescription>\n          </CardHeader>\n          <CardContent className="space-y-2">\n            <div className="space-y-1">\n              <Label htmlFor="current">Current password</Label>\n              <Input id="current" type="password" />\n            </div>\n            <div className="space-y-1">\n              <Label htmlFor="new">New password</Label>\n              <Input id="new" type="password" />\n            </div>\n          </CardContent>\n        </Card>\n      </TabsContent>\n    </Tabs>\n  );\n}`;
        } else {
            example += `export default function Example() {\n  return <${componentName} />;\n}`;
        }
    } else if (component.category === 'feedback') {
        if (component.name === 'alert') {
            example += `import { Alert, AlertDescription, AlertTitle } from '@sailflow/planks';\nimport { Terminal } from 'lucide-react';\n\nexport default function Example() {\n  return (\n    <Alert>\n      <Terminal className="h-4 w-4" />\n      <AlertTitle>Heads up!</AlertTitle>\n      <AlertDescription>\n        You can add components to your app using the cli.\n      </AlertDescription>\n    </Alert>\n  );\n}`;
        } else if (component.name === 'toast') {
            example += `import { useToast, Button, ToastAction } from '@sailflow/planks';\n\nexport default function Example() {\n  const { toast } = useToast();\n\n  return (\n    <Button\n      variant="outline"\n      onClick={() => {\n        toast({\n          title: "Scheduled: Catch up ",\n          description: "Friday, February 10, 2023 at 5:57 PM",\n          action: <ToastAction altText="Try again">Try again</ToastAction>,\n        })\n      }}\n    >\n      Show Toast\n    </Button>\n  );\n}`;
        } else {
            example += `export default function Example() {\n  return <${componentName} />;\n}`;
        }
    } else if (component.category === 'data-display') {
        if (component.name === 'avatar') {
            example += `import { Avatar, AvatarFallback, AvatarImage } from '@sailflow/planks';\n\nexport default function Example() {\n  return (\n    <Avatar>\n      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />\n      <AvatarFallback>CN</AvatarFallback>\n    </Avatar>\n  );\n}`;
        } else {
            example += `export default function Example() {\n  return <${componentName} />;\n}`;
        }
    } else {
        example += `export default function Example() {\n  return <${componentName} />;\n}`;
    }

    return example;
}
