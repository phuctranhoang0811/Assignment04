import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../api/axiosClient';
import HeaderNav from '../components/HeaderNav';
import { setQuestions, selectOption, submitCurrentAnswer, restartQuiz } from '../redux/quizSlice';

// Sample fallback questions from the assignment test data
const DEFAULT_QUESTIONS = [
  {
    _id: 'q1',
    text: 'What is the capital of Germany?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswerIndex: 2,
  },
  {
    _id: 'q2',
    text: 'Who developed the theory of relativity?',
    options: ['Albert Einstein', 'Isaac Newton', 'Galileo Galilei', 'Nikola Tesla'],
    correctAnswerIndex: 0,
  },
  {
    _id: 'q3',
    text: 'What is the symbol for iron on the periodic table?',
    options: ['Fe', 'I', 'Au', 'Ag'],
    correctAnswerIndex: 0,
  },
  {
    _id: 'q4',
    text: 'What is the capital of France?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswerIndex: 0,
  },
  {
    _id: 'q5',
    text: 'What is the capital of England?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswerIndex: 1,
  },
];

function QuizPage() {
  const dispatch = useDispatch();
  const { questions, currentIndex, selectedAnswer, score, isCompleted } = useSelector((state) => state.quiz);

  useEffect(() => {
    const loadQuestions = async () => {
      let loaded = [];
      try {
        // 1. Thử lấy danh sách câu hỏi từ /questions
        const resQ = await axiosClient.get('/questions');
        if (Array.isArray(resQ.data) && resQ.data.length > 0) {
          loaded = resQ.data;
        }
      } catch (err) {
        // Nếu /questions bị 403 (dành cho Admin), thử lấy qua /quizzes
        try {
          const resQuiz = await axiosClient.get('/quizzes');
          if (Array.isArray(resQuiz.data)) {
            for (const qz of resQuiz.data) {
              if (qz.questions && qz.questions.length > 0) {
                loaded = qz.questions;
                break;
              }
            }
          }
        } catch (quizErr) {
          console.error(quizErr);
        }
      }

      if (loaded.length === 0) {
        loaded = DEFAULT_QUESTIONS;
      }

      dispatch(setQuestions(loaded));
    };

    loadQuestions();
  }, [dispatch]);

  const currentQuestion = questions[currentIndex];

  return (
    <div>
      <HeaderNav title="Dashboard" />

      <div className="container text-center mt-5" style={{ maxWidth: '600px' }}>
        {isCompleted ? (
          /* Màn hình hoàn thành Quiz (Ảnh 4) */
          <div>
            <h2 className="display-6 fw-normal mb-3">Quiz Completed</h2>
            <p className="fs-5 text-secondary mb-4">Your score: {score}</p>
            <button className="btn btn-primary px-4 py-2" onClick={() => dispatch(restartQuiz())}>
              Restart Quiz
            </button>
          </div>
        ) : currentQuestion ? (
          /* Màn hình làm Quiz (Ảnh 3) */
          <div>
            <h2 className="display-6 fw-normal mb-3">Quiz</h2>
            <h3 className="fw-bold mb-4">{currentQuestion.text}</h3>

            <div className="text-start d-inline-block mb-4" style={{ minWidth: '200px' }}>
              {currentQuestion.options.map((opt, idx) => (
                <div className="form-check mb-2" key={idx}>
                  <input
                    className="form-check-input"
                    type="radio"
                    name="quizOption"
                    id={`opt-${idx}`}
                    checked={selectedAnswer === idx}
                    onChange={() => dispatch(selectOption(idx))}
                  />
                  <label className="form-check-label ps-2" htmlFor={`opt-${idx}`}>
                    {opt}
                  </label>
                </div>
              ))}
            </div>

            <div>
              <button
                className="btn btn-primary px-4 py-2"
                disabled={selectedAnswer === null}
                onClick={() => dispatch(submitCurrentAnswer())}
              >
                Submit Answer
              </button>
            </div>
          </div>
        ) : (
          <p className="text-muted">Loading questions...</p>
        )}
      </div>
    </div>
  );
}

export default QuizPage;

