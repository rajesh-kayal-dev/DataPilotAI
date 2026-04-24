import axios from 'axios';

const test = async () => {
  try {
    const res = await axios.post('http://localhost:11434/api/embeddings', {
      model: 'invalid-model',
      prompt: 'hello world'
    });
  } catch (e) {
    console.log("e.message:", e.message);
    console.log("e.response.data.error:", e.response?.data?.error);
  }
};
test();
