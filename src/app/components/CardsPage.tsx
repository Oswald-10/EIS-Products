import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type CardsPageProps = Pick<CategoryPageProps, 'items' | 'onBack'>;

export function CardsPage({ items, onBack }: CardsPageProps) {
  return (
    <CategoryPage
      title="Business Cards"
      subtitle="Professional print pieces for your brand."
      items={items}
      onBack={onBack}
    />
  );
}
