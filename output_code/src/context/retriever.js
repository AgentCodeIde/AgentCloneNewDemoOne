const { ChromaClient } = require('chromadb');
const errorParser = require('../utils/errorParser');

class Retriever {
  constructor() {
    this.client = new ChromaClient();
    this.collectionName = 'code-index';
  }

  async init() {
    // Initialize the collection if it doesn't exist
    const collections = await this.client.listCollections();
    if (!collections.includes(this.collectionName)) {
      await this.client.createCollection(this.collectionName);
    }
  }

  async indexFile(filePath, content) {
    // Index a file with its path and content
    await this.client.addDocument(this.collectionName, {
      id: filePath,
      text: content,
      metadata: { path: filePath }
    });
  }

  async retrieveContext(errorLog) {
    const errorContext = errorParser.extractErrorContext(errorLog);
    if (!errorContext) return [];

    // Query the index for related files
    const results = await this.client.query(this.collectionName, {
      queryTexts: [errorContext.stackTrace],
      nResults: 5
    });

    return results.map(result => result.metadata.path);
  }
}

module.exports = new Retriever();