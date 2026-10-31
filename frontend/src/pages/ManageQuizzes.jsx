import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import HeaderNav from '../components/HeaderNav';

function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedNewQuestions, setSelectedNewQuestions] = useState([]);
  const [selectedAddQuestion, setSelectedAddQuestion] = useState({});
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
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

    try {
      const userRes = await axiosClient.get('/users');
      if (Array.isArray(userRes.data)) {
        setUsers(userRes.data);
      }
    } catch (err) {
      console.warn('Could not load users:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleNewQuestion = (qId) => {
    if (selectedNewQuestions.includes(qId)) {
      setSelectedNewQuestions(selectedNewQuestions.filter((id) => id !== qId));
    } else {
      setSelectedNewQuestions([...selectedNewQuestions, qId]);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axiosClient.post('/quizzes', {
        title: title.trim(),
        description: description.trim(),
        questions: selectedNewQuestions,
      });

      setTitle('');
      setDescription('');
      setSelectedNewQuestions([]);
      await fetchData();
      setMessage({ type: 'success', text: 'Quiz / Article created successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error creating quiz' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditQuiz = (qz) => {
    setEditingQuizId(qz._id);
    setEditTitle(qz.title);
    setEditDescription(qz.description || '');
  };

  const handleSaveEditQuiz = async (quizId) => {
    try {
      await axiosClient.put(`/quizzes/${quizId}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setEditingQuizId(null);
      await fetchData();
      setMessage({ type: 'success', text: 'Quiz updated successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error updating quiz' });
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz / article?')) return;

    try {
      await axiosClient.delete(`/quizzes/${id}`);
      await fetchData();
      setMessage({ type: 'success', text: 'Deleted quiz successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error deleting quiz' });
    }
  };

  const handleAddQuestionToQuiz = async (quiz) => {
    const qIdToAdd = selectedAddQuestion[quiz._id];
    if (!qIdToAdd) return;

    const currentIds = (quiz.questions || []).map((q) => (typeof q === 'object' ? q._id : q));
    if (currentIds.includes(qIdToAdd)) return;

    try {
      await axiosClient.put(`/quizzes/${quiz._id}`, {
        title: quiz.title,
        description: quiz.description || '',
        questions: [...currentIds, qIdToAdd],
      });
      setSelectedAddQuestion({ ...selectedAddQuestion, [quiz._id]: '' });
      await fetchData();
      setMessage({ type: 'success', text: 'Added question to quiz successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error adding question' });
    }
  };

  const handleRemoveQuestionFromQuiz = async (quiz, questionIdToRemove) => {
    const currentIds = (quiz.questions || []).map((q) => (typeof q === 'object' ? q._id : q));
    const updatedIds = currentIds.filter((id) => id !== questionIdToRemove);

    try {
      await axiosClient.put(`/quizzes/${quiz._id}`, {
        title: quiz.title,
        description: quiz.description || '',
        questions: updatedIds,
      });
      await fetchData();
      setMessage({ type: 'success', text: 'Removed question from quiz successfully!' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.response?.data?.message || 'Error removing question' });
    }
  };

  return (
    <div>
      <HeaderNav title="Admin Dashboard" />

      <div className="container mt-4 mb-5" style={{ maxWidth: '900px' }}>
        <h2 className="fw-bold mb-4">Manage Articles & Quizzes</h2>

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

        {/* Form tạo Quiz / Article */}
        <div className="card p-4 mb-5 border-1 shadow-none">
          <h4 className="fw-normal mb-3">Add New Quiz / Article</h4>
          <form onSubmit={handleCreateQuiz}>
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Title:</label>
              <div className="col-sm-9">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. JavaScript Basics, Node.js Test..."
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

            {allQuestions.length > 0 && (
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-secondary">Select Questions:</label>
                <div className="col-sm-9">
                  <div
                    className="border rounded p-2"
                    style={{ maxHeight: '160px', overflowY: 'auto' }}
                  >
                    {allQuestions.map((q) => (
                      <div className="form-check py-1" key={q._id}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`new-quiz-q-${q._id}`}
                          checked={selectedNewQuestions.includes(q._id)}
                          onChange={() => handleToggleNewQuestion(q._id)}
                        />
                        <label className="form-check-label small" htmlFor={`new-quiz-q-${q._id}`}>
                          {q.text}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="form-text small">
                    Selected {selectedNewQuestions.length} of {allQuestions.length} questions
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'Creating...' : 'Add Quiz / Article'}
            </button>
          </form>
        </div>

        {/* Danh sách Quiz / Article */}
        <h4 className="fw-normal mb-3">Existing Quizzes & Articles</h4>
        {quizzes.length === 0 ? (
          <div className="card p-4 text-center text-muted border-1 shadow-none mb-5">
            No quizzes available yet. Create one using the form above!
          </div>
        ) : (
          <div className="mb-5">
            {quizzes.map((qz) => {
              const currentQIds = (qz.questions || []).map((q) =>
                typeof q === 'object' ? q._id : q
              );
              const availableToAdd = allQuestions.filter((q) => !currentQIds.includes(q._id));
              const isEditing = editingQuizId === qz._id;

              return (
                <div key={qz._id} className="card p-4 mb-4 border-1 shadow-none">
                  {isEditing ? (
                    <div className="mb-3">
                      <div className="mb-2">
                        <label className="form-label small text-secondary">Edit Title:</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small text-secondary">Edit Description:</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>
                      <button
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleSaveEditQuiz(qz._id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setEditingQuizId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h4 className="fw-bold mb-1">{qz.title}</h4>
                        <p className="text-secondary mb-1 small">{qz.description || 'No description'}</p>
                        <span className="badge bg-primary">
                          {qz.questions?.length || 0} Questions
                        </span>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleStartEditQuiz(qz)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteQuiz(qz._id)}
                        >
                          Delete Quiz
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Danh sách câu hỏi trong Quiz này */}
                  <div className="bg-light p-3 rounded mb-3">
                    <h6 className="fw-bold mb-2">Questions in this Quiz:</h6>
                    {!qz.questions || qz.questions.length === 0 ? (
                      <div className="text-muted small">No questions attached to this quiz yet.</div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {qz.questions.map((q, idx) => {
                          const qId = typeof q === 'object' ? q._id : q;
                          const qText = typeof q === 'object' ? q.text : `Question ID: ${q}`;
                          return (
                            <div
                              key={qId || idx}
                              className="d-flex justify-content-between align-items-center bg-white p-2 rounded border"
                            >
                              <span className="small text-truncate me-2">
                                <strong>Q{idx + 1}:</strong> {qText}
                              </span>
                              <button
                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => handleRemoveQuestionFromQuiz(qz, qId)}
                                title="Remove from this quiz"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Thêm câu hỏi vào Quiz này */}
                  <div className="row g-2 align-items-center">
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
                            ? '-- All available questions already added --'
                            : '-- Select a question to add to this quiz --'}
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
                        className="btn btn-success btn-sm w-100"
                        disabled={!selectedAddQuestion[qz._id]}
                        onClick={() => handleAddQuestionToQuiz(qz)}
                      >
                        + Add Question
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Danh sách người dùng hệ thống (GET /users) */}
        {users.length > 0 && (
          <div className="card p-4 border-1 shadow-none">
            <h4 className="fw-normal mb-3">Registered Users</h4>
            <div className="table-responsive">
              <table className="table table-bordered table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id || i}>
                      <td>{i + 1}</td>
                      <td>{u.username}</td>
                      <td>
                        <span className={`badge ${u.admin ? 'bg-danger' : 'bg-secondary'}`}>
                          {u.admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageQuizzes;
