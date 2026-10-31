import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import HeaderNav from '../components/HeaderNav';

function ManageQuestions() {
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        text: questionText,
        options,
        correctAnswerIndex: Number(correctAnswerIndex),
      };

      if (editingId) {
        await axiosClient.put(`/questions/${editingId}`, payload);
      } else {
        const res = await axiosClient.post('/questions', payload);
        // Tự động liên kết câu hỏi vừa tạo vào Quiz (nếu có bài Quiz)
        if (res.data?.question?._id) {
          try {
            const qzRes = await axiosClient.get('/quizzes');
            if (Array.isArray(qzRes.data) && qzRes.data.length > 0) {
              const quiz = qzRes.data[0];
              const currentIds = (quiz.questions || []).map((q) => q._id || q);
              await axiosClient.put(`/quizzes/${quiz._id}`, {
                title: quiz.title,
                description: quiz.description || '',
                questions: [...currentIds, res.data.question._id],
              });
            }
          } catch (e) {
            // Optional sync
          }
        }
      }

      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(0);
      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving question');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    setQuestionText(q.text);
    setOptions(q.options && q.options.length === 4 ? q.options : ['', '', '', '']);
    setCorrectAnswerIndex(q.correctAnswerIndex ?? 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await axiosClient.delete(`/questions/${id}`);
        fetchQuestions();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting question');
      }
    }
  };

  return (
    <div>
      <HeaderNav title="Admin Dashboard" />

      <div className="container mt-4 mb-5" style={{ maxWidth: '850px' }}>
        <h2 className="fw-bold mb-4">Questions</h2>

        {/* Khung Form Thêm / Cập nhật câu hỏi (Ảnh 7) */}
        <div className="card p-4 mb-5 border-1 shadow-none">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Question Text:</label>
              <div className="col-sm-9">
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
              <label className="col-sm-3 col-form-label text-secondary pt-2">Options:</label>
              <div className="col-sm-9">
                {options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    className="form-control mb-2"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    required
                  />
                ))}
              </div>
            </div>

            <div className="row mb-4 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Correct Answer Index:</label>
              <div className="col-sm-9">
                <input
                  type="number"
                  min="0"
                  max="3"
                  className="form-control"
                  value={correctAnswerIndex}
                  onChange={(e) => setCorrectAnswerIndex(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'Processing...' : editingId ? 'Update Question' : 'Add Question'}
            </button>
          </form>
        </div>

        {/* Danh sách các câu hỏi theo đúng Ảnh 7 */}
        <div className="card border-1 shadow-none">
          {questions.length === 0 ? (
            <div className="p-4 text-center text-muted">No questions yet. Add one using the form above!</div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q._id}
                className={`p-4 ${idx !== questions.length - 1 ? 'border-bottom' : ''}`}
              >
                <h4 className="fw-bold mb-3">{q.text}</h4>
                <ul className="mb-3 ps-3">
                  {q.options?.map((opt, optIdx) => (
                    <li key={optIdx} className="mb-1 text-secondary">
                      {opt}
                    </li>
                  ))}
                </ul>
                <div>
                  <button
                    className="btn btn-warning btn-sm me-2 text-dark px-3 fw-semibold"
                    onClick={() => handleEdit(q)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm px-3"
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

