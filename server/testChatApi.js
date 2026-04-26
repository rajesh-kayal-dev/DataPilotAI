import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/chat';
const TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with a real token if testing locally

const testChat = async () => {
  console.log('\n🔄 Testing POST /api/chat...\n');

  try {
    const res = await axios.post(
      BASE_URL,
      {
        question: 'What is this document about?',
        documentId: '64b1f2a9c1234567890abcd1' // Example ID
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(res.data, null, 2));

  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    const status = err.response?.status || 'No status';
    console.log(`❌ FAILED! (Status: ${status})`);
    console.log(`Detail: ${detail}`);
    
    if (status === 401) {
      console.log('\n💡 Tip: Update the TOKEN variable in this script with a valid JWT from /api/auth/login\n');
    }
  }
};

testChat();
