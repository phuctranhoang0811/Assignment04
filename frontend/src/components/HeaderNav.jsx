import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../redux/authSlice';

function HeaderNav({ title = 'Dashboard' }) {
  const { user, isAdmin } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h1 className="fw-normal mb-0">{title}</h1>
        <span className="text-secondary fs-5">Welcome, {user?.username || 'User'}</span>
      </div>

      <div className="nav-bar-gray d-flex gap-4">
        {isAdmin ? (
          <>
            <Link to="/admin" className="text-decoration-none text-dark">Home</Link>
            <Link to="/admin/questions" className="text-decoration-none text-dark">Manage Questions</Link>
            <Link to="/admin/quizzes" className="text-decoration-none text-dark">Manage Quizzes</Link>
            <Link to="/admin/articles" className="text-decoration-none text-dark">Manage Articles</Link>
            <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={handleLogout}>Logout</span>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="text-decoration-none text-dark">Home</Link>
            <Link to="/dashboard/quiz" className="text-decoration-none text-dark">Quiz</Link>
            <Link to="/dashboard" className="text-decoration-none text-dark">Article</Link>
            <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={handleLogout}>Logout</span>
          </>
        )}
      </div>
    </div>
  );
}

export default HeaderNav;
