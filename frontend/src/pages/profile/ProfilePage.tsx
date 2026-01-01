import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { quizService } from '@/services/quizzes';
import { attemptService } from '@/services/attempts';
import { Attempt } from '@/types/attempt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, Calendar, FileText, LogOut, Trophy, Clock, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        try {
            const [quizzesData, attemptsData] = await Promise.all([
                quizService.listQuizzes(),
                attemptService.getUserAttempts()
            ]);
            setQuizzes(quizzesData);
            setAttempts(attemptsData);
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return 'N/A';
        }
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'N/A';
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">User not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-6 w-6" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600">
                                    <User className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500">Name</p>
                                    <p className="text-lg text-gray-900">{user.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-gray-400 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-lg text-gray-900">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-500">Member Since</p>
                                    <p className="text-lg text-gray-900">{formatDate(user.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-md">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Quizzes Created</p>
                                        <p className="text-2xl font-bold text-indigo-600">{quizzes.length}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-md">
                                        <Trophy className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Quizzes Taken</p>
                                        <p className="text-2xl font-bold text-green-600">{attempts.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-6 w-6" />
                            My Quiz Attempts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {attempts.length === 0 ? (
                            <div className="text-center py-8">
                                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">You haven't taken any quizzes yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {attempts.map((attempt) => {
                                    const totalPoints = attempt.quiz?.total_points || attempt.total_points || 0;
                                    const scorePercentage = totalPoints > 0 && attempt.score !== undefined
                                        ? Math.round((attempt.score / totalPoints) * 100)
                                        : (attempt.score === 0 && totalPoints === 0 ? 0 : null);
                                    const isSubmitted = attempt.status === 'SUBMITTED';
                                    
                                    return (
                                        <div
                                            key={attempt.id}
                                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {attempt.quiz?.title || 'Unknown Quiz'}
                                                        </h3>
                                                        {isSubmitted ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Clock className="h-4 w-4 text-yellow-600" />
                                                        )}
                                                    </div>
                                                    {attempt.quiz?.description && (
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            {attempt.quiz.description}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-col gap-1 text-sm text-gray-500">
                                                        <span>
                                                            Started: {formatDateTime(attempt.started_at)}
                                                        </span>
                                                        {attempt.submitted_at && (
                                                            <span>
                                                                Submitted: {formatDateTime(attempt.submitted_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4 flex flex-col items-end gap-2">
                                                    {isSubmitted ? (
                                                        <>
                                                            <div className="text-2xl font-bold text-indigo-600">
                                                                {scorePercentage || 0}%
                                                            </div>
                                                            <div className="text-sm text-gray-600">
                                                                {(attempt.score ?? 0).toFixed(1)} / {(attempt.quiz?.total_points || attempt.total_points || 0).toFixed(1)} pts
                                                            </div>
                                                            <Button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/attempts/${attempt.id}/results`);
                                                                }}
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                View Results
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="text-sm text-yellow-600 font-medium mb-2">
                                                                In Progress
                                                            </div>
                                                            {attempt.quiz?.share_code && (
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const shareCode = attempt.quiz?.share_code;
                                                                        if (shareCode) {
                                                                            navigate(`/quiz/${shareCode}/take`);
                                                                        }
                                                                    }}
                                                                    variant="default"
                                                                    size="sm"
                                                                >
                                                                    Continue Quiz
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </CardContent>
                </Card>
        </div>
    );
};

