import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type FlyersPageProps = Pick<CategoryPageProps, 'items' | 'onBack'>;

export function FlyersPage({ items, onBack }: FlyersPageProps) {
  return (
    <CategoryPage
      title="Flyers"
      subtitle="High-impact promotional prints."
      items={items}
      onBack={onBack}
    />
  );
}
