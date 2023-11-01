import type Parser from "tree-sitter"

interface Args {
  node: Parser.SyntaxNode
  sourceCode: string
  chunkSize: number
  lastEnd?: number
}

// Define a function to chunk a node and its children into smaller parts based on character limits.
export const chunkNode = ({
  node,
  sourceCode,
  chunkSize,
  lastEnd = 0,
}: Args) => {
  const chunks: string[] = []
  let currentChunk = ""

  // Iterate through the children of the node.
  for (const child of node.children) {
    const childSize = child.endIndex - child.startIndex

    // 1. Check if the child exceeds the character limit.
    if (childSize > chunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk)
        currentChunk = ""
      }

      // Recursively process the child and add its chunks to the result.
      chunks.push(...chunkNode({ node: child, sourceCode, chunkSize, lastEnd }))
    }

    // 2. If child + currentChunk exceeds the character limit
    else if (currentChunk.length + childSize > chunkSize) {
      chunks.push(currentChunk)
      currentChunk = sourceCode.slice(child.startIndex, child.endIndex)
    }

    // 3. Add the text of the child to the current chunk.
    else {
      currentChunk += sourceCode.slice(child.startIndex, child.endIndex)
    }

    // Update the last end position for the next iteration.
    lastEnd = child.endIndex
  }

  // If there is any content left in the current chunk, add it to the new chunks.

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  // Return the array of new chunks.
  return chunks
}
