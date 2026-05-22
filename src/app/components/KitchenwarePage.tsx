import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

const kitchenwareSampleImages = Object.entries(import.meta.glob('/src/assets/images/kitchenware/samples/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }>)
  .map(([_, module]) => module.default)
  .filter((src): src is string => typeof src === 'string');

type KitchenwarePageProps = Pick<CategoryPageProps, 'items' | 'onBack'> & {
  initialSelectedItemTitle?: string;
};

export function KitchenwarePage({ items, onBack, initialSelectedItemTitle }: KitchenwarePageProps) {
  return (
    <CategoryPage
      title="Kitchenware"
      subtitle="Lunchboxes, cutlery, coasters, and bottle openers for your kitchen."
      items={items}
      onBack={onBack}
      slideshowTitle="Sample Finished Products"
      sampleImages={kitchenwareSampleImages}
      initialSelectedItemTitle={initialSelectedItemTitle}
    />
  );
}
