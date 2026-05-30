
# Product Catalog Website Design

A modern, responsive product catalog built with **Vite + React + Bootstrap 5**.

> Originally designed in Figma: [Product catalog website design](https://www.figma.com/design/GixC7W06Bs4pQJIJhprXdu/Product-catalog-website-design)

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 📋 What's New

This project has been completely refactored to use **Bootstrap 5** instead of Tailwind CSS and shadcn/ui:

✅ **Bootstrap 5** - Industry-standard CSS framework  
✅ **Bootstrap Icons** - Beautiful icon library  
✅ **Vite** - Lightning-fast development and builds  
✅ **React 18** - Latest React features  
✅ **TypeScript** - Type-safe code  
✅ **Responsive Design** - Mobile-first approach  

## 📁 Project Structure

```
├── src/
│   ├── main.tsx              # Entry point
│   ├── app/
│   │   ├── App.tsx           # Main layout
│   │   └── components/
│   │       ├── Navigation.tsx # Dark navbar
│   │       ├── HeroCard.tsx   # Hero sections
│   │       ├── GridCard.tsx   # Grid layouts
│   │       └── ProductCard.tsx # Product cards
│   └── styles/
│       ├── index.css         # Main imports
│       ├── bootstrap-custom.css # Custom theme
│       └── fonts.css         # Font definitions
├── package.json              # Dependencies
└── vite.config.ts           # Vite configuration
```

## 🎨 Styling

All styling uses **Bootstrap 5 utility classes**:

```tsx
// Layout
<div className="container-lg px-3">
  <div className="row g-2">
    <div className="col-12 col-md-6">...</div>
  </div>
</div>

// Components
<nav className="navbar navbar-dark fixed-top">...</nav>
<button className="btn btn-primary">Click me</button>

// Icons
<i className="bi bi-search"></i>
```

## 📦 Dependencies

- `bootstrap@^5.3.3` - CSS framework
- `bootstrap-icons@^1.11.3` - Icon library
- `react@^18.3.1` - UI library
- `vite@^6.3.5` - Build tool

## 🔧 Development

### Customize Theme

Edit `src/styles/bootstrap-custom.css`:

```css
:root {
  --primary: #030213;
  --secondary: #f3f3f5;
}
```

### Add New Components

```tsx
// src/app/components/MyComponent.tsx
export function MyComponent() {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <h5 className="card-title">Title</h5>
        <p className="card-text">Content</p>
      </div>
    </div>
  );
}
```

## 📱 Responsive Breakpoints

Bootstrap 5 breakpoints (automatic via responsive classes):

| Breakpoint | Width |
|-----------|-------|
| xs | < 576px |
| sm | ≥ 576px |
| md | ≥ 768px |
| lg | ≥ 992px |
| xl | ≥ 1200px |
| xxl | ≥ 1400px |

Usage: `col-12 col-md-6 col-lg-4` (full width, half on medium, third on large)

## 🚀 Deployment

```bash
pnpm build
# Upload the 'dist' folder to your hosting service
```

Ready for: Vercel, Netlify, GitHub Pages, AWS S3, etc.

## 📝 Notes

- Legacy shadcn/ui components in `src/app/components/ui/` are deprecated and can be removed
- Use Bootstrap's spacing utilities: `p-*`, `m-*`, `px-*`, `py-*`
- For colors, use: `text-primary`, `bg-secondary`, `border-light`, etc.
- Bootstrap Icons: [Full icon list](https://icons.getbootstrap.com/)

---

**Built with ❤️ using Vite, React, and Bootstrap**
  