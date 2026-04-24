import axios from 'axios';

const test = async () => {
  try {
    const res = await axios.post('http://localhost:11434/api/embeddings', "bad body");
  } catch (e) {
    console.log("e.message:", e.message);
    console.log("e.response.data:", e.response?.data);
  }
};
test();
