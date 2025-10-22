import { createClient } from '@supabase/supabase-js';

// Test script to verify Supabase connection
// Make sure to set your environment variables first!

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ziaaiizciqhdbsjqhtab.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_PUBLISHABLE_KEY is not set in environment variables');
  console.log('Please create a .env.local file with your Supabase keys');
  process.exit(1);
}

console.log('🔗 Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n📊 Testing basic connection...');
    const { data, error } = await supabase.from('question_bank').select('id').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('📈 Question bank is accessible');
    
    // Test fetching a few questions
    console.log('\n📝 Fetching sample questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('question_bank')
      .select('id, Category, Question, "Correct Answer"')
      .limit(3);
    
    if (questionsError) {
      console.error('❌ Failed to fetch questions:', questionsError.message);
      return;
    }
    
    console.log('✅ Successfully fetched questions:');
    questions.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.Question.substring(0, 50)}...`);
      console.log(`     Category: ${q.Category}`);
      console.log(`     Correct Answer: ${q['Correct Answer']}`);
    });
    
    // Test other tables
    console.log('\n🎮 Testing game tables...');
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, title')
      .limit(1);
    
    if (gamesError) {
      console.log('⚠️  Games table not accessible or empty:', gamesError.message);
    } else {
      console.log('✅ Games table accessible');
      console.log('📊 Games count:', games.length);
    }
    
    console.log('\n🎉 All tests passed! Your Supabase connection is working correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testConnection();
