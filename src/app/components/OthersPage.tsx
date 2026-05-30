import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type OthersPageProps = Pick<CategoryPageProps, 'items' | 'onBack'>;

export function OthersPage({ items, onBack }: OthersPageProps) {
  return (
    <CategoryPage
      title="Others"
      subtitle="More custom products available upon request."
      items={items}
      onBack={onBack}
    />
  );
}
