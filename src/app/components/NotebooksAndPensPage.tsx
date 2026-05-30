import React from 'react';
import { CategoryPage, type CategoryPageProps } from './CategoryPage';

const notebooksAndPensSampleImages = Object.entries(import.meta.glob('/src/assets/images/notebooksAndPens/samples/*.{png,jpg,jpeg}', { eager: true }) as Record<string, { default: string }> )
  .map(([_, module]) => module.default)
  .filter((src): src is string => typeof src === 'string');

type NotebooksAndPensPageProps = Pick<CategoryPageProps, 'items' | 'onBack'> & {
  initialSelectedItemTitle?: string;
};

export function NotebooksAndPensPage({ items, onBack, initialSelectedItemTitle }: NotebooksAndPensPageProps) {
  return (
    <CategoryPage
      title="Notebooks & Pens"
      subtitle="Custom notebooks and pens for writing, planning, and sketching."
      items={items}
      onBack={onBack}
      slideshowTitle="Sample Finished Products"
      sampleImages={notebooksAndPensSampleImages}
      initialSelectedItemTitle={initialSelectedItemTitle}
    />
  );
}
