import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);

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

    try {
      const payload = {
        text: questionText.trim(),
        options: options.map((o) => o.trim()),
        correctAnswerIndex: Number(correctAnswerIndex) || 0,
        keywords: [],
      };

      if (editingId) {
        await axiosClient.put(`/questions/${editingId}`, payload);
        setMessage({ type: 'success', text: 'Question updated successfully!' });
      } else {
        const res = await axiosClient.post('/questions', payload);
        const newQId = res.data?.question?._id;

        if (newQId && selectedQuizId) {
          try {
            const targetQuiz = quizzes.find((qz) => String(qz._id) === String(selectedQuizId));
            if (targetQuiz) {
              const currentIds = (targetQuiz.questions || []).map((q) => String(q._id || q));
              if (!currentIds.includes(String(newQId))) {
                await axiosClient.put(`/quizzes/${selectedQuizId}`, {
                  title: targetQuiz.title,
                  description: targetQuiz.description || '',
                  questions: [...currentIds, newQId],
                });
                await fetchQuizzes();
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
      await fetchQuestions();
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error saving question' });
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
      try {
        await axiosClient.delete(`/questions/${id}`);
        await fetchQuestions();
        await fetchQuizzes();
        setMessage({ type: 'success', text: 'Question deleted successfully!' });
      } catch (err) {
        setMessage({ type: 'danger', text: err.response?.data?.message || 'Error deleting question' });
      }
    }
  };

  const handleAddToQuiz = async (qId) => {
    if (!selectedQuizId) {
      alert('Please select a quiz first');
      return;
    }
    const targetQuiz = quizzes.find((qz) => String(qz._id) === String(selectedQuizId));
    if (!targetQuiz) return;

    const currentIds = (targetQuiz.questions || []).map((q) => String(q._id || q));
    if (currentIds.includes(String(qId))) {
      alert('Question is already in this quiz!');
      return;
    }

    try {
      await axiosClient.put(`/quizzes/${selectedQuizId}`, {
        title: targetQuiz.title,
        description: targetQuiz.description || '',
        questions: [...currentIds, qId],
      });
      await fetchQuizzes();
      setMessage({ type: 'success', text: 'Added question to quiz successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to add question to quiz' });
    }
  };

  const handleRemoveFromQuiz = async (qId) => {
    if (!selectedQuizId) return;
    const targetQuiz = quizzes.find((qz) => String(qz._id) === String(selectedQuizId));
    if (!targetQuiz) return;

    const currentIds = (targetQuiz.questions || []).map((q) => String(q._id || q));
    const updatedIds = currentIds.filter((id) => String(id) !== String(qId));

    try {
      await axiosClient.put(`/quizzes/${selectedQuizId}`, {
        title: targetQuiz.title,
        description: targetQuiz.description || '',
        questions: updatedIds,
      });
      await fetchQuizzes();
      setMessage({ type: 'success', text: 'Removed question from quiz successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to remove question from quiz' });
    }
  };

  const handleCreateNewQuiz = async (e) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    setQuizLoading(true);
    try {
      const res = await axiosClient.post('/quizzes', {
        title: newQuizTitle.trim(),
        description: newQuizDescription.trim(),
        questions: [],
      });
      const createdQuiz = res.data?.quiz;
      setNewQuizTitle('');
      setNewQuizDescription('');
      setShowQuizModal(false);
      await fetchQuizzes();
      if (createdQuiz?._id) {
        setSelectedQuizId(createdQuiz._id);
      }
      setMessage({
        type: 'success',
        text: `Created new Quiz "${createdQuiz?.title || 'Quiz'}" successfully and selected it!`,
      });
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Error creating quiz',
      });
    } finally {
      setQuizLoading(false);
    }
  };

  const isQuestionInSelectedQuiz = (qId) => {
    if (!selectedQuizId) return false;
    const targetQuiz = quizzes.find((qz) => String(qz._id) === String(selectedQuizId));
    if (!targetQuiz || !targetQuiz.questions) return false;
    return targetQuiz.questions.some((q) => String(q._id || q) === String(qId));
  };

  return (
    <div>
      <HeaderNav title="Admin Dashboard" />

      <div className="container mt-4 mb-5" style={{ maxWidth: '850px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h2 className="fw-bold mb-0">Questions Management</h2>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setShowQuizModal(true)}
            >
              + Create New Quiz
            </button>
            <Link to="/admin/articles" className="btn btn-outline-secondary">
              Manage Articles & Quizzes →
            </Link>
          </div>
        </div>

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

        {/* Modal tạo Quiz mới nhanh */}
        {showQuizModal && (
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">Create New Quiz</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowQuizModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleCreateNewQuiz}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label text-secondary">Quiz Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. JavaScript Advanced, React Basics..."
                        value={newQuizTitle}
                        onChange={(e) => setNewQuizTitle(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-secondary">Description</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Short overview of the quiz..."
                        value={newQuizDescription}
                        onChange={(e) => setNewQuizDescription(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowQuizModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={quizLoading}
                    >
                      {quizLoading ? 'Creating...' : 'Create Quiz'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Form Question */}
        <div className="card p-4 mb-5 border-1 shadow-none">
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
                      placeholder={`Enter answer option ${idx}...`}
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
                  <option value={0}>Option 0: {options[0] || '(empty)'}</option>
                  <option value={1}>Option 1: {options[1] || '(empty)'}</option>
                  <option value={2}>Option 2: {options[2] || '(empty)'}</option>
                  <option value={3}>Option 3: {options[3] || '(empty)'}</option>
                </select>
                <div className="form-text text-success">
                  Selected correct answer: <strong>Option {correctAnswerIndex}</strong>
                </div>
              </div>
            </div>

            <div className="row mb-4 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Assign to Quiz:</label>
              <div className="col-sm-9">
                <div className="input-group">
                  <select
                    className="form-select"
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                  >
                    <option value="">-- Do not add to quiz --</option>
                    {quizzes.map((qz) => (
                      <option key={qz._id} value={qz._id}>
                        {qz.title} ({qz.questions?.length || 0} questions)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={() => setShowQuizModal(true)}
                  >
                    + New Quiz
                  </button>
                </div>
                <small className="text-muted">
                  New question will be automatically linked to the selected quiz.
                </small>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'Processing...' : editingId ? 'Update Question' : 'Add Question'}
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

        {/* Danh sách câu hỏi */}
        <div className="card border-1 shadow-none">
          {questions.length === 0 ? (
            <div className="p-4 text-center text-muted">No questions yet. Add one using the form above!</div>
          ) : (
            questions.map((q, idx) => {
              const inQuiz = isQuestionInSelectedQuiz(q._id);
              return (
                <div
                  key={q._id}
                  className={`p-4 ${idx !== questions.length - 1 ? 'border-bottom' : ''}`}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="fw-bold mb-0">{q.text}</h4>
                    {inQuiz && (
                      <span className="badge bg-success py-1 px-2">In Quiz</span>
                    )}
                  </div>

                  <ul className="mb-3 ps-3 list-unstyled">
                    {q.options?.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.correctAnswerIndex;
                      return (
                        <li
                          key={optIdx}
                          className={`py-1 px-2 mb-1 rounded ${
                            isCorrect ? 'bg-success bg-opacity-10 text-success fw-bold' : ''
                          }`}
                        >
                          <span className="me-2 text-secondary">({optIdx})</span>
                          {opt}
                          {isCorrect && (
                            <span className="badge bg-success ms-2 py-0 px-2 small">
                              Correct Answer
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="d-flex justify-content-end align-items-center gap-2">
                    {selectedQuizId && (
                      inQuiz ? (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleRemoveFromQuiz(q._id)}
                        >
                          Remove from Quiz
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={() => handleAddToQuiz(q._id)}
                        >
                          + Add to Quiz
                        </button>
                      )
                    )}

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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageQuestions;
