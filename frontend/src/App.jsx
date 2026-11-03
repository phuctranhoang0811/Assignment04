import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import QuizPage from './pages/QuizPage';
import ManageQuestions from './pages/ManageQuestions';
import ManageQuizzes from './pages/ManageQuizzes';

function App() {
  const { isAuthenticated, isAdmin } = useSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
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
          path="/dashboard/articles"
          element={isAuthenticated ? <UserDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/quiz"
          element={isAuthenticated ? <QuizPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard/quiz/:quizId"
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
        <Route
          path="/admin/articles"
          element={isAuthenticated && isAdmin ? <ManageQuizzes /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin/quizzes"
          element={isAuthenticated && isAdmin ? <ManageQuizzes /> : <Navigate to="/login" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
