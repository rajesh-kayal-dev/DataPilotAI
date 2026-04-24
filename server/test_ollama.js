import axios from 'axios';

const test = async () => {
  try {
    const res = await axios.post('http://localhost:11434/api/embeddings', {
      model: 'nomic-embed-text',
      prompt: 'hello world'
    });
    console.log("Success", res.data);
  } catch (e) {
    console.log("Error status:", e.response?.status);
    console.log("Error data:", e.response?.data);
    console.log("Error message:", e.message);
  }
};
test();
