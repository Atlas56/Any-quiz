import { useState } from 'react';
import './App.css';
import logo from './assets/nee quiz.svg';

const API_KEY = import.meta.env.VITE_API_KEY;

const systemMessage = {
  role: 'system',
  content:
    "Always respond with a valid JSON array of 20 objects, and do not include any extra text or formatting outside of the JSON. Each object should have the following structure: { 'question': 'The question text', 'options': ['Option 1', 'Option 2', 'Option 3', 'Option 4'], 'correctOption': 'Option 2' }. Ensure one of the options is correct and marked as 'correctOption'. Generate questions based on the given subject.",
};

function App() {
  const [subject, setSubject] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState([]); // Store detailed results
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    const prompt = `Generate 20 multiple-choice questions about "${subject}"`;

    const apiRequestBody = {
      model: 'gpt-3.5-turbo',
      messages: [
        systemMessage,
        { role: 'user', content: prompt },
      ],
    };

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestBody),
      });

      const data = await response.json();
      const responseContent = data.choices[0].message.content;

      const parsedQuestions = JSON.parse(responseContent);
      setQuestions(parsedQuestions);
      setIsQuizActive(true);
      setCurrentQuestionIndex(0);
      setScore({ correct: 0, incorrect: 0 });
      setResults([]); // Reset results for a new quiz
    } catch (err) {
      console.error('Failed to fetch questions or parse response:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correctOption;

    setResults((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        selectedOption: option,
        correctOption: currentQuestion.correctOption,
        isCorrect,
      },
    ]);

    setSelectedOption(option);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setScore((prev) => ({
      ...prev,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
    }));

    setTimeout(() => {
      setFeedback('');
      setSelectedOption(null);

      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setIsQuizActive(false);
        setShowModal(true);
      }
    }, 1000);
  };

  return (
    <div className="App">
      <img className="logoNeeQuiz" src={logo} alt="NE Quiz Logo" />

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading questions...</p>
        </div>
      ) : !isQuizActive ? (
        <div className="subject-input">
          <input
            type="text"
            placeholder="Enter a subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <button onClick={fetchQuestions} disabled={!subject.trim()}>
            Start Quiz
          </button>
        </div>
      ) : (
        <div className="quiz-section">
          <h2>Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <p>{questions[currentQuestionIndex].question}</p>
          <div className="options">
            {questions[currentQuestionIndex].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                className={
                  selectedOption === option
                    ? feedback === 'correct'
                      ? 'correct-option'
                      : 'incorrect-option'
                    : ''
                }
                disabled={!!feedback}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Quiz Results</h2>
            <p>Correct Answers: {score.correct}</p>
            <p>Incorrect Answers: {score.incorrect}</p>
            <div className="results-list">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}
                >
                  <p><strong>Q:</strong> {result.question}</p>
                  <p><strong>Your Answer:</strong> {result.selectedOption}</p>
                  <p><strong>Correct Answer:</strong> {result.correctOption}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
