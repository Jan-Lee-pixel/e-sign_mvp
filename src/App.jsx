import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AuthPage from './components/AuthPage';
import SelfSignPage from './pages/SelfSignPage';
import ComposePage from './pages/ComposePage';
import RecipientSignPage from './pages/RecipientSignPage';
import './App.css';

function App() {
    const [session, setSession] = useState(null);
    const [loadingSession, setLoadingSession] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoadingSession(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loadingSession) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Route for Guests */}
                <Route path="/sign/:token" element={<RecipientSignPage />} />

                {/* Protected Routes */}
                <Route path="/" element={
                    !session ? <AuthPage /> : <SelfSignPage session={session} />
                } />
                <Route path="/compose" element={
                    !session ? <AuthPage /> : <ComposePage />
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
