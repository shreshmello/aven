import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenvPath from 'dotenv';
dotenv.config();
const app = express();
app.use(express.json({ limit: '1mb' }));
const PORT = process.env.PORT || 3030;
app.post('/api/tutor', async (req, res) => {
  const { question, correctAnswer, studentAnswer, reasoning, topic, previousHint } = req.body || {};
  if (![question, studentAnswer].every(v => typeof v === 'string' && v.trim().length)) return res.status(400).json({ error: 'Question and answer are required.' });
  if (question.length > 2000 || studentAnswer.length > 1000 || (reasoning || '').length > 3000) return res.status(413).json({ error: 'Please shorten your response and try again.' });
  if (!process.env.GEMINI_API_KEY) return res.json({ mode: 'demo', ...demoDiagnosis({question,correctAnswer,studentAnswer,reasoning,topic,previousHint}) });
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are Aven, a supportive math learning coach for students. Help diagnose reasoning, never shame students, and don't give the final answer immediately unless they have already tried or asked after hints. The student's reasoning is incomplete, so diagnosis must be a hypothesis and be verified. Respond ONLY as JSON with keys: isCorrect(boolean), diagnosis(string; say what might be happening, or "No misconception detected"), evidence(string), verificationQuestion(string), hint(string), nextStep(string), encouragement(string). Avoid assuming if no reasoning is provided; ask for their reasoning. Use age-appropriate simple language.\nProblem: ${question}\nExpected answer: ${correctAnswer}\nStudent answer: ${studentAnswer}\nReasoning: ${reasoning || 'Not provided'}\nTopic: ${topic || 'math'}\nPrevious hint: ${previousHint || 'none'}\nIf answer is correct, praise the method but gently check if reasoning was provided. If wrong and unclear, ask what they tried. Hint should be targeted and not reveal final answer.`;
    const result = await model.generateContent(prompt);
    let raw = result.response.text().trim().replace(/^```json\s*/,'').replace(/```\s*$/,'');
    const parsed = JSON.parse(raw);
    const keys = ['isCorrect','diagnosis','evidence','verificationQuestion','hint','nextStep','encouragement'];
    if (!keys.every(k => k in parsed)) throw new Error('Unexpected response shape');
    res.json({ mode: 'ai', ...parsed });
  } catch (err) {
    console.error('Tutor API error:', err.message);
    res.json({ mode: 'fallback', ...demoDiagnosis({question,correctAnswer,studentAnswer,reasoning,topic,previousHint}) });
  }
});
function demoDiagnosis({question, correctAnswer, studentAnswer, reasoning, topic, previousHint}) {
  const a = (studentAnswer || '').toLowerCase().replace(/\s/g,'');
  const q = (question || '').toLowerCase();
  let diagnosis = 'I need a little more of your thinking to identify what happened.';
  let evidence = reasoning ? 'I can use the steps you shared to look for a pattern.' : 'You shared an answer but not the steps you used, so I do not want to guess.';
  let verificationQuestion = 'Can you tell me the first step you took to get your answer?';
  let hint = 'Try writing one small step at a time. What do you know from the question, and what operation would help you use it?';
  if (q.includes('1/2') && q.includes('1/3') && (a.includes('2/5') || a.includes('2\u20445'))) {
    diagnosis = 'You may be adding the top and bottom numbers separately. Fractions describe parts of equal-sized wholes, so the denominators need to represent the same-sized pieces before adding.';
    evidence = 'Your answer adds both numerators and denominators directly.';
    verificationQuestion = 'If one pizza is cut into 2 equal pieces and another into 3, are those pieces the same size? What would make the pieces match?';
    hint = 'Try rewriting both fractions using the same denominator. What number can both 2 and 3 divide into evenly?';
  } else if (q.includes('3 × (x + 4)') && (a.includes('3x+4') || a.includes('3*x+4'))) {
    diagnosis = 'You might be multiplying only the first term inside the parentheses. The factor outside applies to every term inside.';
    evidence = 'The x term is multiplied by 3, but the constant 4 stays unchanged.';
    verificationQuestion = 'When 3 multiplies a group containing x and 4, what does it multiply besides x?';
    hint = 'Think of the parentheses as a group. Apply the outside factor to each part of that group.';
  } else if (q.includes('8 - 12') && (a === '-4' || a === '4')) {
    diagnosis = a === '4' ? 'You may have subtracted in the reverse order, or treated the difference as always positive.' : 'That is correct — nice work keeping track of the negative result.';
    evidence = a === '4' ? 'The result is positive even though the starting value is smaller than the amount being subtracted.' : 'Your answer reflects subtracting a larger value from a smaller one.';
    verificationQuestion = a === '4' ? 'If you start at 8 and move 12 steps left on a number line, where do you land?' : 'Can you explain what the negative sign tells us in this result?';
    hint = 'Picture a number line. Starting at 8, subtracting 12 means moving 12 units to the left.';
  } else if (a === String(correctAnswer || '').toLowerCase().replace(/\s/g,'')) {
    diagnosis = 'Your answer looks correct!'; evidence = 'Your answer matches the expected answer.'; verificationQuestion = reasoning ? 'Can you explain why your first step works?' : 'Would you share one step of how you found that?'; hint = 'Try explaining your strategy in your own words to make the idea stick.';
  } else if (!reasoning) {
    diagnosis = 'There is not enough evidence yet to identify a specific misconception.'; evidence = 'I only have your final answer, not the reasoning behind it.'; verificationQuestion = 'What was the first step you tried?'; hint = 'Show me your first step, even if you are not sure it is right. We can work from there.';
  }
  if (previousHint) hint = "Let's try a different angle: " + hint;
  return { isCorrect: a === String(correctAnswer || '').toLowerCase().replace(/\s/g,''), diagnosis, evidence, verificationQuestion, hint, nextStep: 'Try the problem again using the hint. Your new attempt will help us see if the idea is clearer.', encouragement: 'Mistakes are information. You are here to learn, and every attempt counts.' };
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.resolve(__dirname, '../dist')));
app.get('*', (req, res) => { if (req.path.startsWith('/api/')) return res.status(404).json({error:'Not found'}); res.sendFile(path.resolve(__dirname, '../dist/index.html')); });
app.listen(PORT, () => console.log(`Aven server ready at http://localhost:${PORT}`));
