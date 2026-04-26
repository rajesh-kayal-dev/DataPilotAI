import axios from 'axios';

const fetchFreeModels = async () => {
  try {
    const res = await axios.get('https://openrouter.ai/api/v1/models');
    const freeModels = res.data.data
      .filter(m => m.id.endsWith(':free'))
      .map(m => m.id);
    
    console.log('--- Current Free Models ---');
    freeModels.forEach(m => console.log(m));
  } catch (error) {
    console.error('Error fetching models:', error.message);
  }
};

fetchFreeModels();
