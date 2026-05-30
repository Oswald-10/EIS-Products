import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

const bundleSampleImages = Object.entries(import.meta.glob('/src/assets/images/bundle/**/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }> )
  .map(([_, module]) => module.default)
  .filter((src): src is string => typeof src === 'string');

type DigitalAndLargeFormatPageProps = Pick<CategoryPageProps, 'items' | 'onBack'> & {
  initialSelectedItemTitle?: string;
};

export function DigitalAndLargeFormatPage({ items, onBack, initialSelectedItemTitle }: DigitalAndLargeFormatPageProps) {
  return (
    <CategoryPage
      title="Digital & Large Format"
      subtitle="Notebooks, flyers, business cards, tarpaulins, banners, and more."
      items={items}
      onBack={onBack}
      slideshowTitle="Sample Finished Products"
      sampleImages={bundleSampleImages}
      initialSelectedItemTitle={initialSelectedItemTitle}
    />
  );
}
