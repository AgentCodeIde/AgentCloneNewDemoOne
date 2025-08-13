import { ChromaClient } from 'chromadb';
import fs from 'fs';
import path from 'path';
import { createEmbedding } from '../utils/embedding';

const client = new ChromaClient();

async function indexCodebase(rootDir) {
  const collectionName = 'code-index';
  await client.createCollection(collectionName);

  async function indexFile(filePath, relativePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const embedding = await createEmbedding(content);
    await client.addDocument(collectionName, {
      path: relativePath,
      content: content,
      embedding: embedding
    });
  }

  function traverseDirectory(dirPath, relativePath = '') {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const currentRelativePath = path.join(relativePath, file);
      if (fs.statSync(filePath).isDirectory()) {
        traverseDirectory(filePath, currentRelativePath);
      } else {
        indexFile(filePath, currentRelativePath);
      }
    }
  }

  traverseDirectory(rootDir);
}

export { indexCodebase };