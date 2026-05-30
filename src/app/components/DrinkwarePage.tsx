import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

const drinkwareSampleImages = Object.entries(import.meta.glob('/src/assets/images/drinkware/samples/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }> )
  .map(([_, module]) => module.default)
  .filter((src): src is string => typeof src === 'string');

type DrinkwarePageProps = Pick<CategoryPageProps, 'items' | 'onBack'> & {
  initialSelectedItemTitle?: string;
};

export function DrinkwarePage({ items, onBack, initialSelectedItemTitle }: DrinkwarePageProps) {
  return (
    <CategoryPage
      title="Drinkware"
      subtitle="Custom tumblers and drinkware for all occasions."
      items={items}
      onBack={onBack}
      slideshowTitle="Sample Finished Products"
      sampleImages={drinkwareSampleImages}
      initialSelectedItemTitle={initialSelectedItemTitle}
    />
  );
}
