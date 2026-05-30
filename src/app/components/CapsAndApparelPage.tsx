import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

const capsAndApparelSampleImages = Object.entries(import.meta.glob('/src/assets/images/capsAndApparel/samples/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }>)
  .map(([_, module]) => module.default)
  .filter((src): src is string => typeof src === 'string');

type CapsAndApparelPageProps = Pick<CategoryPageProps, 'items' | 'onBack'> & {
  initialSelectedItemTitle?: string;
};

export function CapsAndApparelPage({ items, onBack, initialSelectedItemTitle }: CapsAndApparelPageProps) {
  return (
    <CategoryPage
      title="Caps & Apparel"
      subtitle="Custom caps, shirts, aprons, hoodies, and jackets for every style."
      items={items}
      onBack={onBack}
      slideshowTitle="Sample Finished Products"
      sampleImages={capsAndApparelSampleImages}
      initialSelectedItemTitle={initialSelectedItemTitle}
    />
  );
}
