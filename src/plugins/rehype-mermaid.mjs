import { visit } from 'unist-util-visit';

export default function rehypeMermaid() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (node.tagName !== 'pre') return;

      const code = node.children?.find(
        (child) => child.type === 'element' && child.tagName === 'code'
      );
      if (!code) return;

      const className = code.properties?.className || [];
      const classes = Array.isArray(className) ? className : [className];

      if (!classes.includes('language-mermaid')) return;

      const text = code.children
        ?.filter((child) => child.type === 'text')
        ?.map((child) => child.value)
        ?.join('') ?? '';

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['mermaid'] },
        children: [{ type: 'text', value: text }],
      };
    });
  };
}