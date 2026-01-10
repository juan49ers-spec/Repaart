import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <h1 className="text-6xl font-black text-slate-800 mb-4">404</h1>
            <p className="text-xl text-slate-400 mb-8">Página no encontrada.</p>
            <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all"
            >
                Volver al Dashboard
            </button>
        </div>
    );
};
export default NotFound;
