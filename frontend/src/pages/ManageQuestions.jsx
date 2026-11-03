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
      if (Array.isArray(res.data)) {
        setQuizzes(res.data);
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
      let targetQId = editingId;

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
        targetQId = newQ?._id;

        if (newQ) {
          setQuestions((prev) => [newQ, ...prev]);
        }

        setMessage({ type: 'success', text: 'Question created successfully!' });
      }

      // Xử lý gán câu hỏi vào Quiz đã chọn trong form (cả khi tạo và khi sửa)
      if (targetQId && selectedQuizId) {
        try {
          const targetQuiz = quizzes.find((qz) => String(qz._id) === String(selectedQuizId));
          if (targetQuiz) {
            const currentIds = (targetQuiz.questions || [])
              .filter(Boolean)
              .map((q) => String(q && typeof q === 'object' ? (q._id || q) : q))
              .filter((id) => id && id !== 'undefined' && id !== 'null');

            const qIdStr = String(targetQId);
            if (!currentIds.includes(qIdStr)) {
              await axiosClient.put(`/quizzes/${selectedQuizId}`, {
                title: targetQuiz.title,
                description: targetQuiz.description || '',
                questions: [...currentIds, qIdStr],
              });
              await fetchQuizzes();
            }
          }
        } catch (syncErr) {
          console.error('Error assigning to quiz:', syncErr);
        }
      }

      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(0);
      setEditingId(null);
      setSelectedQuizId('');
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

    // Tự động tìm xem câu hỏi này đang thuộc về bài Quiz nào và hiển thị sẵn trong dropdown Add to Quiz
    const foundQuiz = quizzes.find((qz) =>
      (qz.questions || []).some(
        (item) => String(item && typeof item === 'object' ? item._id : item) === String(q._id)
      )
    );
    setSelectedQuizId(foundQuiz ? foundQuiz._id : '');

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

      <div className="container mt-4 mb-5" style={{ maxWidth: '850px' }}>
        <h2 className="fw-bold mb-3">Questions</h2>

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

        {/* Form Question hỗ trợ cả Add Question và Edit/Update Question kèm Add to Quiz */}
        <div className="card p-3 mb-4 border-1 rounded-1 shadow-none">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3 align-items-center">
              <label className="col-sm-2 col-form-label text-dark">Question Text:</label>
              <div className="col-sm-10">
                <input
                  type="text"
                  className="form-control"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <label className="col-sm-2 col-form-label text-dark pt-1">Options:</label>
              <div className="col-sm-10 d-flex flex-column gap-2">
                {options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    className="form-control"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    required
                  />
                ))}
              </div>
            </div>

            <div className="row mb-3 align-items-center">
              <label className="col-sm-2 col-form-label text-dark">Correct Answer Index:</label>
              <div className="col-sm-10">
                <input
                  type="number"
                  min="0"
                  max="3"
                  className="form-control"
                  value={correctAnswerIndex}
                  onChange={(e) => setCorrectAnswerIndex(e.target.value)}
                  required
                />
                <div className="form-text text-success small mt-1">
                  ✓ Selected: Option {correctAnswerIndex} {options[correctAnswerIndex] ? `("${options[correctAnswerIndex]}")` : ''}
                </div>
              </div>
            </div>

            {/* Mục Add to Quiz có trong cả Form Tạo mới và Form Chỉnh sửa (Edit) */}
            <div className="row mb-3 align-items-center">
              <label className="col-sm-2 col-form-label text-dark">Add to Quiz:</label>
              <div className="col-sm-10">
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

            <button type="submit" className="btn btn-primary w-100 py-2 mt-1" disabled={loading}>
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
                  setSelectedQuizId('');
                  setMessage({ type: '', text: '' });
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Questions List: chỉ có Edit và Delete, không bị ô chọn rườm rà dưới card */}
        <div className="card border-1 rounded-1 shadow-none">
          {questions.length === 0 ? (
            <div className="p-4 text-center text-muted">No questions yet.</div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q._id}
                className={`p-4 ${idx !== questions.length - 1 ? 'border-bottom' : ''}`}
              >
                <h3 className="fw-bold fs-4 mb-2">{q.text}</h3>

                <ul className="ps-4 mb-3">
                  {q.options?.map((opt, optIdx) => {
                    const isCorrect = Number(q.correctAnswerIndex) === optIdx;
                    return (
                      <li
                        key={optIdx}
                        className={`mb-1 ${isCorrect ? 'text-success fw-bold' : ''}`}
                      >
                        {opt}
                        {isCorrect && (
                          <span className="badge bg-success ms-2 py-0 px-2" style={{ fontSize: '0.75rem' }}>
                            ✓ Correct Answer
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div>
                  <button
                    className="btn btn-warning btn-sm me-2 text-dark px-3 fw-semibold"
                    style={{ backgroundColor: '#ffc107', borderColor: '#ffc107' }}
                    onClick={() => handleEdit(q)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm text-white px-3 fw-semibold"
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
