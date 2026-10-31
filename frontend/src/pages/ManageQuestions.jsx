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

    try {
      const payload = {
        text: questionText,
        options,
        correctAnswerIndex: Number(correctAnswerIndex) || 0,
      };

      if (editingId) {
        await axiosClient.put(`/questions/${editingId}`, payload);
      } else {
        const res = await axiosClient.post('/questions', payload);
        const newQId = res.data?.question?._id;

        // Nếu admin chọn bài Quiz, tự động thêm câu hỏi này vào Quiz đó
        if (newQId && selectedQuizId) {
          const targetQuiz = quizzes.find((qz) => qz._id === selectedQuizId);
          if (targetQuiz) {
            const currentIds = (targetQuiz.questions || []).map((q) => q._id || q);
            if (!currentIds.includes(newQId)) {
              await axiosClient.put(`/quizzes/${selectedQuizId}`, {
                title: targetQuiz.title,
                description: targetQuiz.description || '',
                questions: [...currentIds, newQId],
              });
              await fetchQuizzes();
            }
          }
        }
      }

      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswerIndex(0);
      setEditingId(null);
      await fetchQuestions();
      alert(editingId ? 'Question updated successfully!' : 'Question added successfully!');
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
        fetchQuizzes();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting question');
      }
    }
  };

  // Thêm trực tiếp câu hỏi vào Quiz đang chọn
  const handleAddToQuiz = async (qId) => {
    if (!selectedQuizId) {
      alert('Please select a quiz first');
      return;
    }
    const targetQuiz = quizzes.find((qz) => qz._id === selectedQuizId);
    if (!targetQuiz) return;

    const currentIds = (targetQuiz.questions || []).map((q) => q._id || q);
    if (currentIds.includes(qId)) {
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
      alert('Added question to quiz successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add question to quiz');
    }
  };

  // Xóa câu hỏi khỏi bài Quiz đang chọn
  const handleRemoveFromQuiz = async (qId) => {
    if (!selectedQuizId) return;
    const targetQuiz = quizzes.find((qz) => qz._id === selectedQuizId);
    if (!targetQuiz) return;

    const currentIds = (targetQuiz.questions || []).map((q) => q._id || q);
    const updatedIds = currentIds.filter((id) => id !== qId);

    try {
      await axiosClient.put(`/quizzes/${selectedQuizId}`, {
        title: targetQuiz.title,
        description: targetQuiz.description || '',
        questions: updatedIds,
      });
      await fetchQuizzes();
      alert('Removed question from quiz successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove question from quiz');
    }
  };

  // Kiểm tra xem câu hỏi có thuộc quiz đang chọn không
  const isQuestionInSelectedQuiz = (qId) => {
    if (!selectedQuizId) return false;
    const targetQuiz = quizzes.find((qz) => qz._id === selectedQuizId);
    if (!targetQuiz || !targetQuiz.questions) return false;
    return targetQuiz.questions.some((q) => (q._id || q) === qId);
  };

  return (
    <div>
      <HeaderNav title="Admin Dashboard" />

      <div className="container mt-4 mb-5" style={{ maxWidth: '850px' }}>
        <h2 className="fw-bold mb-4">Questions</h2>

        {/* Khung Form Thêm / Cập nhật câu hỏi */}
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

            {/* Ô nhập chỉ số đáp án đúng (Correct Answer Index) */}
            <div className="row mb-3 align-items-center">
              <label className="col-sm-3 col-form-label text-secondary">Correct Answer Index:</label>
              <div className="col-sm-9">
                <input
                  type="number"
                  min="0"
                  max="3"
                  className="form-control"
                  value={correctAnswerIndex}
                  onChange={(e) => setCorrectAnswerIndex(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
                <div className="form-text text-success">
                  ✓ Đáp án đúng hiện tại: <strong>Option {correctAnswerIndex !== '' ? correctAnswerIndex : 0}</strong> ({options[correctAnswerIndex] || 'Chưa nhập nội dung'})
                </div>
              </div>
            </div>

            {/* Mục chọn Quiz để gán câu hỏi vào */}
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
                      {qz.title} ({qz.questions?.length || 0} questions)
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Câu hỏi mới tạo sẽ tự động được đưa vào bài thi trắc nghiệm này.
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
                }}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Danh sách các câu hỏi */}
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

                  {/* Hiển thị rõ ràng danh sách Options và ĐÁP ÁN ĐÚNG trên UI */}
                  <ul className="mb-3 ps-3 list-unstyled">
                    {q.options?.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.correctAnswerIndex;
                      return (
                        <li
                          key={optIdx}
                          className={`mb-2 d-flex align-items-center ${
                            isCorrect ? 'text-success fw-bold' : 'text-secondary'
                          }`}
                        >
                          <span className="me-2">• Option {optIdx}: {opt}</span>
                          {isCorrect && (
                            <span className="badge bg-success-subtle text-success border border-success ms-2 small">
                              ✓ Correct Answer (Index {optIdx})
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <div>
                    {/* Nút Thêm / Xóa khỏi bài Quiz */}
                    {inQuiz ? (
                      <button
                        className="btn btn-outline-danger btn-sm me-2 px-3"
                        onClick={() => handleRemoveFromQuiz(q._id)}
                      >
                        Remove from Quiz
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline-success btn-sm me-2 px-3"
                        onClick={() => handleAddToQuiz(q._id)}
                      >
                        + Add to Quiz
                      </button>
                    )}

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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageQuestions;
