/**
 * MDX wraps text written on its own lines inside JSX in a paragraph:
 *
 *   <p className="...">
 *     Some text
 *   </p>
 *
 * becomes <p><p>Some text</p></p>, which is invalid HTML and breaks hydration. Mintlify
 * tolerated it, so migrated content does this a lot; unwrap those paragraphs for elements
 * that can only hold inline content.
 */
import type { Root } from 'mdast';

const INLINE_ONLY = new Set([
  'p',
  'span',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'button',
  'label',
  'strong',
  'em',
  'small',
  'figcaption',
  'summary',
]);

interface Node {
  type: string;
  name?: string | null;
  children?: Node[];
}

function unwrap(node: Node) {
  if (!node.children) return;
  if (
    (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
    node.name &&
    INLINE_ONLY.has(node.name)
  ) {
    node.children = node.children.flatMap((child) => (child.type === 'paragraph' ? (child.children ?? []) : [child]));
  }
  for (const child of node.children) unwrap(child);
}

export function remarkUnwrapInlineJsx() {
  return (tree: Root) => unwrap(tree as Node);
}
