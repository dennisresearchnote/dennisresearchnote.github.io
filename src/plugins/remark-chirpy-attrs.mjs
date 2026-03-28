import { visit } from 'unist-util-visit';

export default function remarkChirpyAttrs() {
  return (tree) => {
    visit(tree, (node) => {
      if (!node || !Array.isArray(node.children)) return;

      const nextChildren = [];
      let pendingTarget = null;

      for (const child of node.children) {
        if (isAttrParagraph(child)) {
          if (pendingTarget) {
            const attrs = parseAttrString(getAttrText(child));
            applyAttrs(pendingTarget, attrs);
          } else if (nextChildren.length > 0) {
            const prev = nextChildren[nextChildren.length - 1];
            const attrs = parseAttrString(getAttrText(child));
            applyAttrs(prev, attrs);
          }
          continue;
        }

        nextChildren.push(child);
        pendingTarget = child;
      }

      node.children = nextChildren;
    });
  };
}

function isAttrParagraph(node) {
  if (!node || node.type !== 'paragraph') return false;
  if (!Array.isArray(node.children) || node.children.length !== 1) return false;

  const only = node.children[0];
  return only.type === 'text' && /^\{\:\s*.+\s*\}$/.test(only.value.trim());
}

function getAttrText(node) {
  return node.children[0].value.trim().replace(/^\{\:\s*|\s*\}$/g, '');
}

function parseAttrString(input) {
  const classes = [];
  const props = {};

  const regex =
    /(?:\.([A-Za-z0-9_-]+))|(?:([A-Za-z0-9_:-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+)))/g;

  let match;
  while ((match = regex.exec(input)) !== null) {
    if (match[1]) {
      classes.push(match[1]);
      continue;
    }

    const key = match[2];
    const value = match[3] ?? match[4] ?? match[5] ?? '';
    props[key] = value;
  }

  return { classes, props };
}

function applyAttrs(node, attrs) {
  if (!node || (!attrs.classes.length && Object.keys(attrs.props).length === 0)) {
    return;
  }

  const data = (node.data ??= {});
  const hProperties = (data.hProperties ??= {});

  // Markdown image 단독 문단이면 이미지에 직접 붙이는 것이 Chirpy 기대치에 더 가깝습니다.
  if (
    node.type === 'paragraph' &&
    Array.isArray(node.children) &&
    node.children.length === 1 &&
    node.children[0].type === 'image'
  ) {
    const image = node.children[0];
    const imageData = (image.data ??= {});
    const imageProps = (imageData.hProperties ??= {});

    mergeClassNames(imageProps, attrs.classes);
    Object.assign(imageProps, attrs.props);
    return;
  }

  // 코드블록 file='...' 처리를 위해 data-file도 같이 남겨둡니다.
  if (node.type === 'code' && attrs.props.file) {
    hProperties['data-file'] = attrs.props.file;
  }

  mergeClassNames(hProperties, attrs.classes);
  Object.assign(hProperties, attrs.props);
}

function mergeClassNames(hProperties, newClasses) {
  if (!newClasses.length) return;

  const existing = normalizeClassList(hProperties.className);
  hProperties.className = [...new Set([...existing, ...newClasses])];
}

function normalizeClassList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((v) => String(v).split(/\s+/)).filter(Boolean);
  return String(value).split(/\s+/).filter(Boolean);
}