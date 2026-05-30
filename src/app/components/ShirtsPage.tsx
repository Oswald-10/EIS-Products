import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type ShirtsPageProps = Pick<CategoryPageProps, 'items' | 'onBack'>;

export function ShirtsPage({ items, onBack }: ShirtsPageProps) {
  return (
    <CategoryPage
      title="Custom Shirts"
      subtitle="Comfortable and customizable apparel."
      items={items}
      onBack={onBack}
      slideshowTitle="Sample DTF Shirts"
      secondaryTitle="Sample Embroidered Shirts"
      secondaryImages={items.map((item) => item.image)}
    />
  );
}
