import { insertVectors } from './src/services/vector/qdrantService.js';

const test = async () => {
  try {
    console.log("Trying qdrant...");
    await insertVectors([{
      id: "64a2b1c3_0",
      vector: new Array(768).fill(0.1),
      payload: { docId: "123", content: "test", chunkIndex: 0 }
    }]);
  } catch (e) {
    console.error("Caught error message:", e.message);
  }
}

test();
