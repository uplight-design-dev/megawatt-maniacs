import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvPath = path.join(__dirname, '../public/MegaWatt Maniac trivia_ master question list for events - Energy history_general.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Simple CSV parser that handles multi-line fields
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const questions = [];
  let currentRecord = [];
  let inQuotes = false;
  let currentField = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        currentRecord.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // If we're not in quotes, we've reached the end of a record
    if (!inQuotes) {
      currentRecord.push(currentField.trim());
      
      // Skip header row
      if (i > 0 && currentRecord.length >= 5) {
        questions.push({
          category: currentRecord[0] || '',
          question: currentRecord[1] || '',
          answerOptions: currentRecord[2] || '',
          correctAnswer: currentRecord[3] || '',
          source: currentRecord[4] || ''
        });
      }
      
      currentRecord = [];
      currentField = '';
    } else {
      // Still in quotes, add newline and continue
      currentField += '\n';
    }
  }
  
  return questions;
}

// Parse answer options
function parseAnswerOptions(answerOptions) {
  const lines = answerOptions.split('\n').map(line => line.trim()).filter(line => line);
  const answers = { A: '', B: '', C: '', D: '' };
  
  lines.forEach(line => {
    if (line.startsWith('A)')) {
      answers.A = line.substring(2).trim();
    } else if (line.startsWith('B)')) {
      answers.B = line.substring(2).trim();
    } else if (line.startsWith('C)')) {
      answers.C = line.substring(2).trim();
    } else if (line.startsWith('D)')) {
      answers.D = line.substring(2).trim();
    }
  });
  
  return answers;
}

// Convert CSV question to database format
function convertCSVQuestionToDB(csvQuestion) {
  const answers = parseAnswerOptions(csvQuestion.answerOptions);
  const correctAnswer = csvQuestion.correctAnswer.replace(/^[A-D]\)\s*/, '').trim();
  
  // Determine correct answer letter
  let correctLetter = 'A';
  Object.entries(answers).forEach(([letter, answer]) => {
    if (answer === correctAnswer) {
      correctLetter = letter;
    }
  });
  
  // If there's a D answer, we need to convert it to C and adjust the correct answer
  if (answers.D && answers.D.trim()) {
    // Move D to C position
    answers.C = answers.D;
    // Adjust correct answer if it was D
    if (correctLetter === 'D') {
      correctLetter = 'C';
    }
  }
  
  return {
    category: csvQuestion.category,
    question_text: csvQuestion.question,
    answer_a: answers.A || '',
    answer_b: answers.B || '',
    answer_c: answers.C || '',
    correct_answer: correctLetter,
    source: csvQuestion.source
  };
}

// Parse and convert questions
const csvQuestions = parseCSV(csvContent);
const dbQuestions = csvQuestions.map(convertCSVQuestionToDB);

// Generate SQL insert statements
const sqlStatements = dbQuestions.map(q => {
  return `INSERT INTO public.question_bank ("Category", "Question", "A", "B", "C", "Correct Answer", "Source (Include a url)") VALUES (
    '${q.category.replace(/'/g, "''")}',
    '${q.question_text.replace(/'/g, "''")}',
    '${q.answer_a.replace(/'/g, "''")}',
    '${q.answer_b.replace(/'/g, "''")}',
    '${q.answer_c.replace(/'/g, "''")}',
    '${q.correct_answer}',
    '${q.source.replace(/'/g, "''")}'
  );`;
});

// Write SQL file
const sqlContent = `-- Import question bank data
${sqlStatements.join('\n')}
`;

fs.writeFileSync(path.join(__dirname, '../supabase/migrations/20250110000001_import_question_bank_data.sql'), sqlContent);

console.log(`Generated SQL for ${dbQuestions.length} questions`);
console.log('SQL file created: supabase/migrations/20250110000001_import_question_bank_data.sql');
