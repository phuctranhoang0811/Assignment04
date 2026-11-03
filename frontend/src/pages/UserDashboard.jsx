import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axiosClient from '../api/axiosClient';
import HeaderNav from '../components/HeaderNav';
import { setQuestions } from '../redux/quizSlice';

function UserDashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await axiosClient.get('/quizzes');
        if (Array.isArray(res.data)) {
          setQuizzes(res.data);
        }
      } catch (err) {
        console.error('Error fetching quizzes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const handleStartQuiz = (quiz) => {
    if (quiz.questions && quiz.questions.length > 0) {
      dispatch(setQuestions({ questions: quiz.questions, title: quiz.title }));
    }
    navigate(`/dashboard/quiz/${quiz._id}`);
  };

  return (
    <div>
      <HeaderNav title="Dashboard" />

      <div className="container mt-4 mb-5" style={{ maxWidth: '800px' }}>
        <h3 className="fw-normal mb-4">Quizzes</h3>

        {loading ? (
          <p className="text-muted">Loading quizzes...</p>
        ) : quizzes.length === 0 ? (
          <div className="card p-4 text-center text-muted border-1 shadow-none">
            No quizzes available at the moment.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {quizzes.map((qz) => (
              <div
                key={qz._id}
                className="card p-4 border-1 shadow-none d-flex flex-row justify-content-between align-items-center"
              >
                <div>
                  <h4 className="fw-bold mb-1">{qz.title}</h4>
                  <p className="text-secondary mb-1 small">
                    {qz.description || 'Test your knowledge with this quiz.'}
                  </p>
                  <span className="badge bg-secondary">
                    {qz.questions?.length || 0} Questions
                  </span>
                </div>

                <div>
                  <button
                    className="btn btn-primary px-3 py-2 fw-semibold"
                    onClick={() => handleStartQuiz(qz)}
                  >
                    Click and do Quiz →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
