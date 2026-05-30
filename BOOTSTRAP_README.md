# Product Catalog - Bootstrap Edition

A modern, responsive product catalog website built with Vite, React, TypeScript, and Bootstrap 5.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 📁 Project Structure

```
src/
├── main.tsx                 # Application entry point
├── styles/
│   ├── index.css           # Main stylesheet (imports Bootstrap + custom styles)
│   ├── bootstrap-custom.css # Bootstrap customizations
│   ├── fonts.css           # Font imports
│   └── tailwind.css        # Legacy (can be removed)
└── app/
    ├── App.tsx             # Main app component with layout
    └── components/
        ├── Navigation.tsx   # Top navbar
        ├── HeroCard.tsx     # Hero section component
        ├── GridCard.tsx     # Grid card component
        ├── ProductCard.tsx  # Product card component
        └── ui/              # Legacy shadcn/ui components (deprecated)
```

## 🎨 Styling

This project uses **Bootstrap 5** for all styling. Key features:

- **Responsive Grid System**: Uses Bootstrap's `container-lg`, `row`, and `col-*` classes
- **Bootstrap Icons**: Utilizes bootstrap-icons for all icons (`<i class="bi bi-*"></i>`)
- **Custom Overrides**: See `src/styles/bootstrap-custom.css` for theme customizations
- **Dark Navbar**: Pre-configured dark navigation with backdrop blur effect

### Bootstrap Classes Reference

- **Layout**: `container-lg`, `row`, `col-12`, `col-md-6`
- **Spacing**: `px-3`, `py-4`, `py-md-6`, `gap-*`, `mb-*`
- **Typography**: `display-4`, `fs-5`, `fw-bold`, `text-muted`
- **Colors**: `bg-white`, `bg-light`, `text-white`, `link-primary`
- **Components**: `navbar`, `navbar-dark`, `btn`, `btn-link`

## 📦 Dependencies

### Production
- `react`: ^18.3.1
- `react-dom`: ^18.3.1
- `bootstrap`: ^5.3.3
- `bootstrap-icons`: ^1.11.3

### Development
- `vite`: ^6.3.5
- `@vitejs/plugin-react`: ^4.7.0

## 🛠️ Development

### Add New Components

Create new components in `src/app/components/` using Bootstrap classes:

```tsx
// Example: Badge Component
export function Badge({ label, variant = 'primary' }: BadgeProps) {
  return <span className={`badge bg-${variant}`}>{label}</span>;
}
```

### Customize Theme

Edit `src/styles/bootstrap-custom.css` to override Bootstrap variables or add custom styles:

```css
:root {
  --primary: #030213;
  --secondary: #f3f3f5;
}
```

## 🚀 Deployment

```bash
# Build production bundle
pnpm build

# Preview build locally
pnpm preview
```

The `dist/` folder is ready for deployment to any static hosting service (Vercel, Netlify, etc.).

## 📝 Notes

- The legacy `src/app/components/ui/` folder contains deprecated shadcn/ui components. These can be safely deleted if not needed.
- All color utilities and animations are handled through Bootstrap's utility classes.
- For responsive design, rely on Bootstrap's breakpoints: `xs`, `sm` (576px), `md` (768px), `lg` (992px), `xl` (1200px), `xxl` (1400px).

## 📄 License

Created with Vite + Bootstrap + React
