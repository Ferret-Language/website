/**
 * Expressive Code plugin to mark runnable code blocks
 */
export function expressiveCodeRunnable() {
  return {
    name: 'runnable-marker',
    hooks: {
      postprocessRenderedBlock: ({ codeBlock, renderData }) => {
        // Check if meta contains "runnable"
        if (!codeBlock.meta?.includes('runnable')) return;
        
        // Add attributes to the figure element
        if (renderData.blockAst?.tagName === 'figure') {
          renderData.blockAst.properties = renderData.blockAst.properties || {};
          renderData.blockAst.properties.dataRunnable = 'true';
          renderData.blockAst.properties.dataCode = codeBlock.code;
        }
      }
    }
  };
}
