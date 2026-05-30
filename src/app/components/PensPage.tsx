import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type PensPageProps = Pick<CategoryPageProps, 'items' | 'onBack'>;

export function PensPage({ items, onBack }: PensPageProps) {
  return (
    <CategoryPage
      title="Pens"
      subtitle="Stylish writing instruments for every use."
      items={items}
      onBack={onBack}
    />
  );
}
