import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type TumblersPageProps = Pick<CategoryPageProps, 'items' | 'onBack'>;

export function TumblersPage({ items, onBack }: TumblersPageProps) {
  return (
    <CategoryPage
      title="Tumblers"
      subtitle="Custom drinkware that travels well."
      items={items}
      onBack={onBack}
    />
  );
}
