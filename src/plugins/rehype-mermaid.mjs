import { visit } from 'unist-util-visit';

function extractText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (!Array.isArray(node.children)) return '';
  return node.children.map(extractText).join('');
}

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

      const text = extractText(code).trim();
      if (!text) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['mermaid'] },
        children: [{ type: 'text', value: text }],
      };
    });
  };
}