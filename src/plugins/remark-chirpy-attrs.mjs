import { visit } from 'unist-util-visit';

export default function remarkChirpyAttrs() {
  return (tree) => {
    // 1) 블록 레벨 속성 문법 처리
    visit(tree, (node) => {
      if (!node || !Array.isArray(node.children)) return;
      applyTrailingAttributeParagraphs(node);
    });

    // 2) blockquote 안에 텍스트로 흡수된 {: .prompt-tip } 처리
    visit(tree, 'blockquote', (node) => {
      applyBlockquoteTrailingAttrs(node);
    });

    // 3) inline code 뒤에 붙는 {: .filepath } 처리
    visit(tree, 'paragraph', (node) => {
      applyInlineTrailingAttrs(node);
    });
  };
}

/* ----------------------------------------
 * 1) 일반적인 trailing attr paragraph 처리
 * 예:
 * ## H2
 * {: .mt-4 .mb-0 }
 *
 * ```bash
 * echo hi
 * ```
 * {: file='_sass/jekyll-theme-chirpy.scss'}
 * -------------------------------------- */
function applyTrailingAttributeParagraphs(parent) {
  const nextChildren = [];
  let pendingTarget = null;

  for (const child of parent.children) {
    if (isAttrParagraph(child)) {
      const attrs = parseAttrString(getAttrTextFromParagraph(child));

      if (pendingTarget) {
        applyAttrs(pendingTarget, attrs);
      } else if (nextChildren.length > 0) {
        applyAttrs(nextChildren[nextChildren.length - 1], attrs);
      }

      continue;
    }

    nextChildren.push(child);
    pendingTarget = child;
  }

  parent.children = nextChildren;
}

function isAttrParagraph(node) {
  if (!node || node.type !== 'paragraph') return false;
  if (!Array.isArray(node.children) || node.children.length !== 1) return false;

  const only = node.children[0];
  return only.type === 'text' && /^\{\:\s*.+\s*\}$/.test(only.value.trim());
}

function getAttrTextFromParagraph(node) {
  return node.children[0].value.trim().replace(/^\{\:\s*|\s*\}$/g, '');
}

/* ----------------------------------------
 * 2) blockquote 내부 마지막 문단에 흡수된 attr 처리
 * 현재 사용자 상태:
 * <blockquote>
 *   <p>... {: .prompt-tip }</p>
 * </blockquote>
 * -------------------------------------- */
function applyBlockquoteTrailingAttrs(blockquote) {
  if (!blockquote.children?.length) return;

  const last = blockquote.children[blockquote.children.length - 1];
  if (!last || last.type !== 'paragraph' || !Array.isArray(last.children)) return;
  if (last.children.length === 0) return;

  const tail = last.children[last.children.length - 1];
  if (!tail || tail.type !== 'text') return;

  const match = tail.value.match(/\{\:\s*([^}]+)\s*\}\s*$/);
  if (!match) return;

  const attrs = parseAttrString(match[1]);

  tail.value = tail.value.replace(/\{\:\s*([^}]+)\s*\}\s*$/, '');

  if (tail.value.length === 0) {
    last.children.pop();
  }

  if (last.children.length === 0) {
    blockquote.children.pop();
  }

  applyAttrs(blockquote, attrs);
}

/* ----------------------------------------
 * 3) inline trailing attr 처리
 * 예:
 * Here is the `/path/to/file`{: .filepath }.
 * -------------------------------------- */
function applyInlineTrailingAttrs(paragraph) {
  if (!Array.isArray(paragraph.children) || paragraph.children.length < 2) return;

  for (let i = 1; i < paragraph.children.length; i++) {
    const prev = paragraph.children[i - 1];
    const curr = paragraph.children[i];

    if (!curr || curr.type !== 'text') continue;

    const match = curr.value.match(/^\{\:\s*([^}]+)\s*\}([.,;:]*)$/);
    if (!match) continue;

    const attrs = parseAttrString(match[1]);
    applyInlineAttrs(prev, attrs);

    const trailingPunctuation = match[2] ?? '';

    if (trailingPunctuation) {
      curr.value = trailingPunctuation;
    } else {
      paragraph.children.splice(i, 1);
      i -= 1;
    }
  }
}

function applyInlineAttrs(node, attrs) {
  if (!node || (!attrs.classes.length && Object.keys(attrs.props).length === 0)) {
    return;
  }

  const data = (node.data ??= {});
  const hProperties = (data.hProperties ??= {});

  mergeClassNames(hProperties, attrs.classes);
  Object.assign(hProperties, attrs.props);
}

/* ----------------------------------------
 * 공통 속성 파서 / 적용
 * -------------------------------------- */
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

  // 이미지 단독 문단이면 img 자체에 붙이는 게 맞음
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

  const data = (node.data ??= {});
  const hProperties = (data.hProperties ??= {});

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
  if (Array.isArray(value)) {
    return value.flatMap((v) => String(v).split(/\s+/)).filter(Boolean);
  }
  return String(value).split(/\s+/).filter(Boolean);
}