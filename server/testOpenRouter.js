import 'dotenv/config';
import axios from 'axios';

const API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

const models = {
  FAST:  process.env.FAST_MODEL,
  CHAT:  process.env.CHAT_MODEL,
  SMART: process.env.SMART_MODEL,
};

const testModel = async (name, modelId) => {
  process.stdout.write(`  ${name} (${modelId})... `);
  try {
    const res = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: modelId,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 10,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'DataPilot AI',
        },
        timeout: 30000,
      }
    );
    const reply = res.data?.choices?.[0]?.message?.content?.trim();
    console.log(`✅ ${reply}`);
  } catch (err) {
    const detail = err.response?.data?.error?.message || err.message;
    console.log(`❌ ${detail}`);
  }
};

const testEmbedModel = async () => {
  const modelId = process.env.EMBED_MODEL;
  process.stdout.write(`  EMBED (${modelId})... `);
  try {
    const res = await axios.post(
      `${BASE_URL}/embeddings`,
      {
        model: modelId,
        input: 'Test string for embedding',
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'DataPilot AI',
        },
        timeout: 30000,
      }
    );
    const hasEmbedding = res.data?.data?.[0]?.embedding?.length > 0;
    if (hasEmbedding) {
      console.log(`✅ OK (Dimension: ${res.data.data[0].embedding.length})`);
    } else {
      console.log(`❌ Embedding data missing`);
    }
  } catch (err) {
    const detail = err.response?.data?.error?.message || err.message;
    console.log(`❌ ${detail}`);
  }
};

const run = async () => {
  console.log('\n🔄 Testing all OpenRouter models...\n');
  if (!API_KEY) { console.error('❌ OPENROUTER_API_KEY missing in .env'); process.exit(1); }

  for (const [name, id] of Object.entries(models)) {
    await testModel(name, id);
  }
  
  await testEmbedModel();

  console.log('\n✅ Done. Update .env model IDs to swap models anytime.\n');
};

run();
