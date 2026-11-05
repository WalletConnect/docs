import { ImageZoom, type ImageZoomProps } from 'fumadocs-ui/components/image-zoom';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/**
 * Markdown images (`![]()`) get width/height from remark-image, so they go through ImageZoom
 * (next/image + click to zoom). Raw `<img>` tags in MDX have no dimensions, so they can't.
 */
export function Img(props: ComponentProps<'img'>) {
  const local = typeof props.src === 'string' && props.src.startsWith('/');
  if (typeof props.src === 'object' || (local && props.width && props.height)) {
    return <ImageZoom {...(props as ImageZoomProps)} />;
  }
  return <img {...props} alt={props.alt ?? ''} className={cn('rounded-lg', props.className)} />;
}
