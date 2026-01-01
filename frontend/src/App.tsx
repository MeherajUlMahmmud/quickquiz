import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/authContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import { APP_ROUTES } from './utils/constants';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { CreateQuizPage } from './pages/quiz/CreateQuizPage';
import { EditQuizPage } from './pages/quiz/EditQuizPage';
import { TakeQuizPage } from './pages/quiz/TakeQuizPage';
import { QuizResultsPage } from './pages/quiz/QuizResultsPage';
import { PublicQuizPage } from './pages/quiz/PublicQuizPage';
import { ProfilePage } from './pages/profile/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path={APP_ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={APP_ROUTES.REGISTER} element={<RegisterPage />} />
          <Route
            path={APP_ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.PROFILE}
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.CREATE_QUIZ}
            element={
              <ProtectedRoute>
                <CreateQuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.EDIT_QUIZ_PATTERN}
            element={
              <ProtectedRoute>
                <EditQuizPage />
              </ProtectedRoute>
            }
          />
          <Route path={APP_ROUTES.PUBLIC_QUIZ_PATTERN} element={<PublicQuizPage />} />
          <Route path={APP_ROUTES.TAKE_QUIZ_PATTERN} element={<TakeQuizPage />} />
          <Route path={APP_ROUTES.QUIZ_RESULTS_PATTERN} element={<QuizResultsPage />} />
          <Route path={APP_ROUTES.HOME} element={<Navigate to={APP_ROUTES.DASHBOARD} replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;

