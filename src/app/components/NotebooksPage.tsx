import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type NotebooksPageProps = Pick<CategoryPageProps, 'items' | 'onBack'>;

export function NotebooksPage({ items, onBack }: NotebooksPageProps) {
  return (
    <CategoryPage
      title="Notebooks"
      subtitle="Premium notebooks for notes and ideas."
      items={items}
      onBack={onBack}
    />
  );
}
