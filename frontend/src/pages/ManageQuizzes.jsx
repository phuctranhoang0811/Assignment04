import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import HeaderNav from '../components/HeaderNav';

function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchQuizzes = async () => {
    try {
      const res = await axiosClient.get('/quizzes');
      if (Array.isArray(res.data)) {
        setQuizzes(res.data);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosClient.post('/quizzes', {
        title,
        description,
        questions: [],
      });
      setTitle('');
      setDescription('');
      fetchQuizzes();
      alert('Created new Quiz successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await axiosClient.delete(`/quizzes/${id}`);
        fetchQuizzes();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting quiz');
      }
    }
  };

  return (
    <div>
      <HeaderNav title="Admin Dashboard" />

      <div className="container mt-4 mb-5" style={{ maxWidth: '850px' }}>
        <h2 className="fw-bold mb-4">Manage Quizzes</h2>

        {/* Form Tạo Quiz Mới */}
        <div className="card p-4 mb-5 border-1 shadow-none">
          <h4 className="fw-normal mb-3">Create New Quiz</h4>
          <form onSubmit={handleCreateQuiz}>
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Quiz Title:</label>
              <div className="col-sm-9">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. JavaScript Basics, History Quiz..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Description:</label>
              <div className="col-sm-9">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Short description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </form>
        </div>

        {/* Danh sách Quiz hiện có */}
        <h4 className="fw-normal mb-3">Existing Quizzes</h4>
        <div className="card border-1 shadow-none">
          {quizzes.length === 0 ? (
            <div className="p-4 text-center text-muted">No quizzes available yet.</div>
          ) : (
            quizzes.map((qz, idx) => (
              <div
                key={qz._id}
                className={`p-4 d-flex justify-content-between align-items-center ${
                  idx !== quizzes.length - 1 ? 'border-bottom' : ''
                }`}
              >
                <div>
                  <h4 className="fw-bold mb-1">{qz.title}</h4>
                  <p className="text-secondary mb-2 small">{qz.description || 'No description'}</p>
                  <span className="badge bg-primary">
                    {qz.questions?.length || 0} Questions
                  </span>
                </div>

                <div>
                  <button
                    className="btn btn-outline-primary btn-sm me-2"
                    onClick={() => navigate('/admin/questions')}
                  >
                    Manage Questions
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteQuiz(qz._id)}
                  >
                    Delete Quiz
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageQuizzes;
