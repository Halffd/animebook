// Simple test script for the tokenizer
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Import the tokenizer
const { tokenize } = require('./server/services/tokenizer');

async function testTokenizer() {
  console.log('Testing tokenizer...');
  
  try {
    // Test with a simple Japanese sentence
    const text = '私は日本語を勉強しています。';
    console.log(`Input text: ${text}`);
    
    const tokens = await tokenize(text);
    console.log('Tokenization successful!');
    console.log('Tokens:', JSON.stringify(tokens, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTokenizer(); 