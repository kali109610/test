import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** Built labs, loaded on demand so each lab's dependencies stay out of the hub bundle. */
export const LAB_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  tokenizer: lazy(() => import('./tokenizer/TokenizerLab')),
};
