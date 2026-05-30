import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

const umbrellasAndBagsSampleImages = Object.entries(import.meta.glob('/src/assets/images/umbrellasAndBags/samples/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }>)
  .map(([_, module]) => module.default)
  .filter((src): src is string => typeof src === 'string');

type UmbrellasAndBagsPageProps = Pick<CategoryPageProps, 'items' | 'onBack'> & {
  initialSelectedItemTitle?: string;
};

export function UmbrellasAndBagsPage({ items, onBack, initialSelectedItemTitle }: UmbrellasAndBagsPageProps) {
  return (
    <CategoryPage
      title="Umbrellas & Bags"
      subtitle="Custom umbrellas and tote bags for travel and everyday use."
      items={items}
      onBack={onBack}
      slideshowTitle="Sample Finished Products"
      sampleImages={umbrellasAndBagsSampleImages}
      initialSelectedItemTitle={initialSelectedItemTitle}
    />
  );
}
