import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

const accessoriesSampleImages = Object.entries(import.meta.glob('/src/assets/images/accessories/samples/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }>)
  .map(([_, module]) => module.default)
  .filter((src): src is string => typeof src === 'string');

type AccessoriesPageProps = Pick<CategoryPageProps, 'items' | 'onBack'> & {
  initialSelectedItemTitle?: string;
};

export function AccessoriesPage({ items, onBack, initialSelectedItemTitle }: AccessoriesPageProps) {
  return (
    <CategoryPage
      title="Accessories"
      subtitle="Mirrors, lamps, keychains, clocks, brushes, combs, fans, chess boards, pouches, bag tags, lanyards, and pins."
      items={items}
      onBack={onBack}
      slideshowTitle="Sample Finished Products"
      sampleImages={accessoriesSampleImages}
      initialSelectedItemTitle={initialSelectedItemTitle}
    />
  );
}
