import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import HeaderNav from '../components/HeaderNav';

function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchQuestions = async () => {
    try {
      const res = await axiosClient.get('/questions');
      if (Array.isArray(res.data)) {
        setQuestions(res.data);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await axiosClient.get('/quizzes');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setQuizzes(res.data);
        if (!selectedQuizId) {
          setSelectedQuizId(res.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchQuizzes();
  }, []);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const payload = {
      text: questionText.trim(),
      options: options.map((o) => o.trim()),
      correctAnswerIndex: Number(correctAnswerIndex) || 0,
      keywords: [],
    };

    try {
      if (editingId) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === editingId ? { ...q, ...payload } : q))
        );
        setMessage({ type: 'success', text: 'Question updated successfully!' });

        const res = await axiosClient.put(`/questions/${editingId}`, payload);
        if (res.data?.question) {
          setQuestions((prev) =>
            prev.map((q) => (q._id === editingId ? res.data.question : q))
          );
        }
      } else {
        const res = await axiosClient.post('/questions', payload);
        const newQ = res.data?.question;
        const newQId = newQ?._id;

        if (newQ) {
          setQuestions((prev) => [newQ, ...prev]);
        }

        if (newQId && selectedQuizId) {
          try {
            const targetQuiz = quizzes.find((qz) => String(qz._id) === String(selectedQuizId));
            if (targetQuiz) {
              const currentIds = (targetQuiz.questions || []).map((q) =>
                String(typeof q === 'object' ? q._id : q)
              );
              if (!currentIds.includes(String(newQId))) {
                setQuizzes((prev) =>
                  prev.map((qz) =>
                    String(qz._id) === String(selectedQuizId)
                      ? { ...qz, questions: [...(qz.questions || []), newQ] }
                      : qz
                  )
                );
                await axiosClient.put(`/quizzes/${selectedQuizId}`, {
                  title: targetQuiz.title,
                  description: targetQuiz.description || '',
                  questions: [...currentIds, newQId],
                });
              }
            }
          } catch (syncErr) {
            console.warn('Could not auto-add to quiz:', syncErr);
          }
        }

        setMessage({ type: 'success', text: 'Question created successfully!' });
      }

      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(0);
      setEditingId(null);
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error saving question' });
      fetchQuestions();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    setQuestionText(q.text || '');
    setOptions(q.options?.length === 4 ? [...q.options] : ['', '', '', '']);
    setCorrectAnswerIndex(q.correctAnswerIndex ?? 0);
    setMessage({ type: '', text: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      setMessage({ type: 'success', text: 'Question deleted successfully!' });

      try {
        await axiosClient.delete(`/questions/${id}`);
      } catch (err) {
        setMessage({ type: 'danger', text: err.response?.data?.message || 'Error deleting question' });
        fetchQuestions();
      }
    }
  };

  return (
    <div>
      <HeaderNav title="Admin Dashboard" />

      <div className="container mt-4 mb-5" style={{ maxWidth: '800px' }}>
        <h2 className="fw-normal mb-4">Questions</h2>

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

        {/* Clean minimal Question Form */}
        <div className="card p-4 mb-4 border-1 shadow-none">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Question Text:</label>
              <div className="col-sm-9">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter question text..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <label className="col-sm-3 col-form-label text-secondary pt-2">Options (0 - 3):</label>
              <div className="col-sm-9">
                {options.map((opt, idx) => (
                  <div key={idx} className="input-group mb-2">
                    <span className="input-group-text bg-light text-muted small" style={{ width: '85px' }}>
                      Option {idx}
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Enter option ${idx}...`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Correct Answer Index:</label>
              <div className="col-sm-9">
                <select
                  className="form-select"
                  value={correctAnswerIndex}
                  onChange={(e) => setCorrectAnswerIndex(Number(e.target.value))}
                  required
                >
                  <option value={0}>0: {options[0] || '(empty)'}</option>
                  <option value={1}>1: {options[1] || '(empty)'}</option>
                  <option value={2}>2: {options[2] || '(empty)'}</option>
                  <option value={3}>3: 3: {options[3] || '(empty)'}</option>
                </select>
              </div>
            </div>

            <div className="row mb-4 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Add to Quiz:</label>
              <div className="col-sm-9">
                <select
                  className="form-select"
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                >
                  <option value="">-- Do not add to quiz --</option>
                  {quizzes.map((qz) => (
                    <option key={qz._id} value={qz._id}>
                      {qz.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Question' : 'Add Question'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-outline-secondary w-100 py-2 mt-2"
                onClick={() => {
                  setEditingId(null);
                  setQuestionText('');
                  setOptions(['', '', '', '']);
                  setCorrectAnswerIndex(0);
                  setMessage({ type: '', text: '' });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Clean minimal questions list */}
        <div className="card border-1 shadow-none">
          {questions.length === 0 ? (
            <div className="p-4 text-center text-muted">No questions yet.</div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q._id}
                className={`p-4 ${idx !== questions.length - 1 ? 'border-bottom' : ''}`}
              >
                <h5 className="fw-bold mb-2">{q.text}</h5>

                <ul className="mb-3 ps-3 list-unstyled">
                  {q.options?.map((opt, optIdx) => (
                    <li key={optIdx} className="py-1 text-secondary small">
                      <span className="me-2 text-dark font-monospace">({optIdx})</span>
                      {opt}
                      {optIdx === q.correctAnswerIndex && (
                        <span className="badge bg-success ms-2 py-0 px-2" style={{ fontSize: '0.75rem' }}>
                          Correct
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleEdit(q)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleDelete(q._id)}
                  >
                    Delete
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

export default ManageQuestions;
