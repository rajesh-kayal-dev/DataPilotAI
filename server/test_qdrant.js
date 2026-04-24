import { QdrantClient } from '@qdrant/js-client-rest';
const client = new QdrantClient({ url: 'http://localhost:6333' });

const test = async () => {
  try {
    await client.getCollections();
    console.log("collections retrieved");
  } catch(e) {
    console.log("error", e.message);
  }
}
test();
