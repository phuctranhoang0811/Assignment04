import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import HeaderNav from '../components/HeaderNav';

function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAddQuestion, setSelectedAddQuestion] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = async () => {
    try {
      const [quizRes, qRes] = await Promise.all([
        axiosClient.get('/quizzes'),
        axiosClient.get('/questions'),
      ]);
      if (Array.isArray(quizRes.data)) {
        setQuizzes(quizRes.data);
      }
      if (Array.isArray(qRes.data)) {
        setAllQuestions(qRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axiosClient.post('/quizzes', {
        title: title.trim(),
        description: description.trim(),
        questions: [],
      });

      const newQz = res.data?.quiz;
      if (newQz) {
        setQuizzes((prev) => [...prev, { ...newQz, questions: [] }]);
      }

      setTitle('');
      setDescription('');
      setMessage({ type: 'success', text: 'Created quiz successfully!' });
      await fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error creating quiz' });
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    setQuizzes((prev) => prev.filter((q) => q._id !== id));
    setMessage({ type: 'success', text: 'Deleted quiz successfully!' });

    try {
      await axiosClient.delete(`/quizzes/${id}`);
      await fetchData();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error deleting quiz' });
      fetchData();
    }
  };

  const handleAddQuestionToQuiz = async (quiz) => {
    const qIdToAdd = selectedAddQuestion[quiz._id];
    if (!qIdToAdd) return;

    const currentIds = (quiz.questions || [])
      .filter(Boolean)
      .map((q) => String(q && typeof q === 'object' ? (q._id || q) : q))
      .filter((id) => id && id !== 'undefined' && id !== 'null');

    const cleanQId = String(qIdToAdd);
    if (currentIds.includes(cleanQId)) {
      setMessage({ type: 'info', text: 'Question is already in this quiz!' });
      return;
    }

    try {
      await axiosClient.put(`/quizzes/${quiz._id}`, {
        title: quiz.title,
        description: quiz.description || '',
        questions: [...currentIds, cleanQId],
      });
      setSelectedAddQuestion({ ...selectedAddQuestion, [quiz._id]: '' });
      await fetchData();
      setMessage({ type: 'success', text: `Added question to "${quiz.title}" successfully!` });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error adding question' });
      fetchData();
    }
  };

  const handleRemoveQuestionFromQuiz = async (quiz, questionIdToRemove) => {
    const currentIds = (quiz.questions || [])
      .filter(Boolean)
      .map((q) => String(q && typeof q === 'object' ? (q._id || q) : q))
      .filter((id) => id && id !== 'undefined' && id !== 'null');

    const cleanIdToRemove = String(questionIdToRemove);
    const updatedIds = currentIds.filter((id) => id !== cleanIdToRemove);

    try {
      await axiosClient.put(`/quizzes/${quiz._id}`, {
        title: quiz.title,
        description: quiz.description || '',
        questions: updatedIds,
      });
      await fetchData();
      setMessage({ type: 'success', text: `Removed question from "${quiz.title}"!` });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error removing question' });
      fetchData();
    }
  };

  return (
    <div>
      <HeaderNav title="Admin Dashboard" />

      <div className="container mt-4 mb-5" style={{ maxWidth: '800px' }}>
        <h2 className="fw-normal mb-4">Manage Articles</h2>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage({ type: '', text: '' })}
            ></button>
          </div>
        )}

        {/* Clean minimal Add Quiz Form */}
        <div className="card p-4 mb-4 border-1 shadow-none">
          <h5 className="fw-normal mb-3">Add New Quiz / Article</h5>
          <form onSubmit={handleCreateQuiz}>
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Title:</label>
              <div className="col-sm-9">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Quiz title..."
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
              {loading ? 'Creating...' : 'Add Quiz'}
            </button>
          </form>
        </div>

        {/* Clean minimal Quizzes List */}
        <h5 className="fw-normal mb-3">Existing Quizzes</h5>
        {quizzes.length === 0 ? (
          <div className="card p-4 text-center text-muted border-1 shadow-none">
            No quizzes available yet.
          </div>
        ) : (
          quizzes.map((qz) => {
            const currentQIds = (qz.questions || [])
              .filter(Boolean)
              .map((q) => String(q && typeof q === 'object' ? (q._id || q) : q));

            const availableToAdd = allQuestions.filter(
              (q) => !currentQIds.includes(String(q._id))
            );

            return (
              <div key={qz._id} className="card p-4 mb-3 border-1 shadow-none">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold mb-1">{qz.title}</h5>
                    <p className="text-secondary mb-1 small">{qz.description || 'No description'}</p>
                    <span className="badge bg-secondary">
                      {qz.questions?.filter(Boolean).length || 0} Questions
                    </span>
                  </div>

                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDeleteQuiz(qz._id)}
                  >
                    Delete Quiz
                  </button>
                </div>

                {/* List questions inside quiz */}
                {qz.questions && qz.questions.filter(Boolean).length > 0 && (
                  <div className="my-2 border rounded p-2 bg-light">
                    {qz.questions.filter(Boolean).map((q, idx) => {
                      const qId = typeof q === 'object' ? q._id : q;
                      const qText = typeof q === 'object' ? q.text : `Question ID: ${q}`;
                      return (
                        <div
                          key={qId || idx}
                          className="d-flex justify-content-between align-items-center py-1 border-bottom last-border-0"
                        >
                          <span className="small text-truncate me-2">
                            {idx + 1}. {qText}
                          </span>
                          <button
                            className="btn btn-link text-danger p-0 small text-decoration-none"
                            onClick={() => handleRemoveQuestionFromQuiz(qz, qId)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Dropdown to add questions */}
                <div className="row g-2 align-items-center mt-2">
                  <div className="col-sm-9">
                    <select
                      className="form-select form-select-sm"
                      value={selectedAddQuestion[qz._id] || ''}
                      onChange={(e) =>
                        setSelectedAddQuestion({
                          ...selectedAddQuestion,
                          [qz._id]: e.target.value,
                        })
                      }
                      disabled={availableToAdd.length === 0}
                    >
                      <option value="">
                        {availableToAdd.length === 0
                          ? '-- All questions already added --'
                          : '-- Select a question to add --'}
                      </option>
                      {availableToAdd.map((q) => (
                        <option key={q._id} value={q._id}>
                          {q.text}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-sm-3">
                    <button
                      className="btn btn-outline-primary btn-sm w-100"
                      disabled={!selectedAddQuestion[qz._id]}
                      onClick={() => handleAddQuestionToQuiz(qz)}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ManageQuizzes;
