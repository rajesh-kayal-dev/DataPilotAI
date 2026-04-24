import axios from 'axios';

const test = async () => {
  const text = 'This is a sample document text. Replace with real PDF extraction.';
  try {
    const res = await axios.post(
      'http://localhost:11434/api/embeddings',
      {
        model: 'nomic-embed-text',
        prompt: text, 
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log("Success");
  } catch (e) {
    console.log("Error status:", e.response?.status);
    console.log("Error data:", e.response?.data);
    console.log("Error message:", e.message);
  }
};
test();
