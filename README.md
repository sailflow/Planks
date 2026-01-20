# @keel/ui

React component library built with Radix UI and Tailwind CSS.

## Installation

```bash
bun add @keel/ui
```

## Usage

```tsx
import { Button, Card, CardContent } from '@keel/ui';
import '@keel/ui/styles.css';

export default function App() {
  return (
    <Card>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Components

- **Primitives**: Button, Input, Label, Checkbox, Switch, Select, etc.
- **Layout**: Card, Container, Separator
- **Data Display**: Avatar, Badge, DataTable
- **Feedback**: Alert, Skeleton, Toast
- **Navigation**: Tabs, Dropdown Menu

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Watch mode
bun run dev
```

## Publishing

Create a GitHub release to publish to npm automatically.
