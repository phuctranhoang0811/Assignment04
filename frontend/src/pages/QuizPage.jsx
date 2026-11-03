import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import HeaderNav from '../components/HeaderNav';
import { setQuestions, selectOption, submitCurrentAnswer, finishQuiz, restartQuiz } from '../redux/quizSlice';

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
  const { quizId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { questions, quizTitle, currentIndex, selectedAnswer, score, isCompleted } = useSelector((state) => state.quiz);

  useEffect(() => {
    const loadQuestions = async () => {
      if (quizId) {
        try {
          const res = await axiosClient.get(`/quizzes/${quizId}`);
          const quizData = res.data?.data || res.data;
          if (quizData && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
            dispatch(setQuestions({ questions: quizData.questions, title: quizData.title }));
            return;
          }
        } catch (err) {
          console.error('Error fetching quiz by ID:', err);
        }
      }

      if (questions.length > 0) {
        return;
      }

      let loaded = [];
      try {
        const resQuiz = await axiosClient.get('/quizzes');
        const quizList = resQuiz.data?.data || resQuiz.data;
        if (Array.isArray(quizList)) {
          for (const qz of quizList) {
            if (qz.questions && qz.questions.length > 0) {
              dispatch(setQuestions({ questions: qz.questions, title: qz.title }));
              return;
            }
          }
        }
      } catch (quizErr) {
        console.error(quizErr);
      }

      if (loaded.length === 0) {
        loaded = DEFAULT_QUESTIONS;
      }

      dispatch(setQuestions({ questions: loaded, title: 'Sample Quiz' }));
    };

    loadQuestions();
  }, [quizId, dispatch]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex + 1 >= questions.length;

  return (
    <div>
      <HeaderNav title="Dashboard" />

      <div className="container text-center mt-5" style={{ maxWidth: '600px' }}>
        {isCompleted ? (
          <div>
            <h2 className="display-6 fw-normal mb-3">Quiz Completed</h2>
            <p className="fs-5 text-secondary mb-4">Your score: {score}</p>
            <div className="d-flex justify-content-center gap-2">
              <button className="btn btn-primary px-4 py-2" onClick={() => dispatch(restartQuiz())}>
                Restart Quiz
              </button>
              <button className="btn btn-outline-secondary px-4 py-2" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          <div>
            <h2 className="display-6 fw-normal mb-3">{quizTitle || 'Quiz'}</h2>
            {questions.length > 1 && (
              <p className="text-secondary small mb-2">
                Question {currentIndex + 1} of {questions.length}
              </p>
            )}
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

            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-primary px-4 py-2"
                disabled={selectedAnswer === null}
                onClick={() => dispatch(submitCurrentAnswer())}
              >
                {isLastQuestion ? 'Submit Answer' : 'Submit Answer'}
              </button>
              {questions.length > 1 && (
                <button
                  className="btn btn-outline-secondary px-3 py-2"
                  disabled={selectedAnswer === null}
                  onClick={() => dispatch(finishQuiz())}
                >
                  Finish Quiz
                </button>
              )}
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

