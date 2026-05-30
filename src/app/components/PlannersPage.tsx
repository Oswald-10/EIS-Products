import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type PlannersPageProps = Pick<CategoryPageProps, 'items' | 'onBack'>;

export function PlannersPage({ items, onBack }: PlannersPageProps) {
  return (
    <CategoryPage
      title="Planners"
      subtitle="Stay organized with custom planning tools."
      items={items}
      onBack={onBack}
    />
  );
}
