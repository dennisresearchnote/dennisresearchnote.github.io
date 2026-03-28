import { visit } from 'unist-util-visit';

function toClassList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((item) => String(item).split(/\s+/)).filter(Boolean);
  return String(value).split(/\s+/).filter(Boolean);
}

function addClass(node, ...classNames) {
  if (!node.properties) node.properties = {};
  const existing = toClassList(node.properties.className);
  node.properties.className = [...new Set([...existing, ...classNames])];
}

function getDataFile(preNode) {
  const preFile = preNode?.properties?.['data-file'];
  if (typeof preFile === 'string' && preFile.trim()) return preFile.trim();

  const codeChild = preNode?.children?.find(
    (child) => child?.type === 'element' && child?.tagName === 'code'
  );

  const codeFile = codeChild?.properties?.['data-file'];
  if (typeof codeFile === 'string' && codeFile.trim()) return codeFile.trim();

  return null;
}

export default function rehypeCodeTitles() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      if (node.tagName !== 'pre') return;

      const dataFile = getDataFile(node);
      if (!dataFile) return;

      addClass(node, 'has-code-title');

      const figureNode = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['code-block'] },
        children: [
          {
            type: 'element',
            tagName: 'figcaption',
            properties: {},
            children: [{ type: 'text', value: dataFile }],
          },
          node,
        ],
      };

      parent.children[index] = figureNode;
    });
  };
}