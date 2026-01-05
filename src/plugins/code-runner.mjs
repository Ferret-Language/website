import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to add "Run in Playground" buttons to code blocks with runnable attribute
 */
export function rehypeCodeRunner() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      // Look for <figure> elements with class "expressive-code"
      if (
        node.tagName === 'figure' &&
        node.properties?.className?.includes('expressive-code')
      ) {
        // Find the <pre> element inside
        const pre = findPreElement(node);
        if (!pre) return;

        // Check if it's a Ferret code block
        if (pre.properties?.dataLanguage !== 'ferret') return;
        
        // Check for runnable in various places
        const figcaption = node.children?.find(child => child.tagName === 'figcaption');
        const headerText = figcaption ? extractText(figcaption) : '';
        
        // Check if runnable appears anywhere
        const isRunnable = 
          headerText.includes('runnable') ||
          pre.properties?.meta?.includes('runnable') || 
          node.properties?.meta?.includes('runnable') ||
          pre.properties?.className?.includes('runnable') ||
          node.properties?.className?.includes('runnable');

        if (!isRunnable) return;

        // Extract the code content from the pre element
        const code = extractCodeContent(pre);
        if (!code) return;

        // Add data-runnable attribute to the figure for easier CSS targeting
        node.properties = node.properties || {};
        node.properties.dataRunnable = 'true';
        node.properties.dataCode = code;
      }
    });
  };
}

function extractText(node) {
  let text = '';
  function traverse(n) {
    if (n.type === 'text') text += n.value;
    else if (n.children) n.children.forEach(traverse);
  }
  traverse(node);
  return text;
}

function findPreElement(node) {
  if (node.tagName === 'pre') return node;
  
  if (node.children) {
    for (const child of node.children) {
      if (child.type === 'element') {
        const found = findPreElement(child);
        if (found) return found;
      }
    }
  }
  
  return null;
}

function extractCodeContent(preNode) {
  let code = '';
  
  function traverse(node) {
    if (node.type === 'text') {
      code += node.value;
    } else if (node.children) {
      node.children.forEach(traverse);
    }
  }
  
  traverse(preNode);
  return code.trim();
}

export default rehypeCodeRunner;
