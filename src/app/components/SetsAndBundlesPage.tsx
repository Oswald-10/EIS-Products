import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

type SetsAndBundlesPageProps = Pick<CategoryPageProps, 'items' | 'onBack'> & {
  initialSelectedItemTitle?: string;
};

export function SetsAndBundlesPage({ items, onBack, initialSelectedItemTitle }: SetsAndBundlesPageProps) {
  return (
    <CategoryPage
      title="Sets & Bundles"
      subtitle="Curated package bundles for promotions, gifts, and events."
      items={items}
      onBack={onBack}
      showSlideshow={false}
      initialSelectedItemTitle={initialSelectedItemTitle}
    />
  );
}
