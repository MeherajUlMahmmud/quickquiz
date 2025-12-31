import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { FileText, User, LogOut, LayoutDashboard, Plus } from 'lucide-react';
import { APP_ROUTES } from '../utils/constants';

export const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate(APP_ROUTES.LOGIN);
    };

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-8">
                        <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => navigate(APP_ROUTES.DASHBOARD)}
                        >
                            <FileText className="h-6 w-6 text-indigo-600" />
                            <h1 className="text-xl font-semibold">QuickQuiz</h1>
                        </div>
                        <div className="hidden md:flex items-center gap-1">
                            <Button
                                variant={isActive(APP_ROUTES.DASHBOARD) ? "default" : "ghost"}
                                size="sm"
                                onClick={() => navigate(APP_ROUTES.DASHBOARD)}
                            >
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                            <Button
                                variant={isActive(APP_ROUTES.CREATE_QUIZ) ? "default" : "ghost"}
                                size="sm"
                                onClick={() => navigate(APP_ROUTES.CREATE_QUIZ)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create Quiz
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(APP_ROUTES.PROFILE)}
                            className={isActive(APP_ROUTES.PROFILE) ? "bg-accent" : ""}
                        >
                            <User className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">{user?.name.split(' ')[0]}</span>
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

