import 'dotenv/config';
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const check = async () => {
  try {
    const info = await client.getCollection(process.env.QDRANT_COLLECTION || 'documents');
    console.log('Collection Info:', JSON.stringify(info, null, 2));
  } catch (e) {
    console.log('Error:', e.message);
  }
};

check();
