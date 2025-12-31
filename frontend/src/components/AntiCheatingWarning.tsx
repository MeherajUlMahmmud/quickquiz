import { AlertCircle } from 'lucide-react';

interface AntiCheatingWarningProps {
    visible: boolean;
    message: string;
}

export const AntiCheatingWarning: React.FC<AntiCheatingWarningProps> = ({ visible, message }) => {
    if (!visible) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
            <div className="bg-red-50 border-2 border-red-500 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 min-w-[300px]">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800">{message}</p>
            </div>
        </div>
    );
};

