import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import QuizPage from './pages/QuizPage';
import ManageQuestions from './pages/ManageQuestions';

function App() {
  const { isAuthenticated, isAdmin } = useSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
        {/* Đường dẫn mặc định */}
        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/login'}
              replace
            />
          }
        />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <UserDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/quiz"
          element={isAuthenticated ? <QuizPage /> : <Navigate to="/login" replace />}
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={isAuthenticated && isAdmin ? <ManageQuestions /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/questions"
          element={isAuthenticated && isAdmin ? <ManageQuestions /> : <Navigate to="/login" replace />}
        />

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
