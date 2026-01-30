import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AuthPage from './components/AuthPage';
import SelfSignPage from './pages/SelfSignPage';
import ComposePage from './pages/ComposePage';
import RecipientSignPage from './pages/RecipientSignPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import MySignaturesPage from './pages/MySignaturesPage';
import SubscriptionPage from './pages/SubscriptionPage';
import UnifiedStartPage from './pages/UnifiedStartPage';
import AIAssistantPage from './pages/AIAssistantPage';
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
                <Route path="/login" element={
                    !session ? <AuthPage /> : <Navigate to="/dashboard" />
                } />

                <Route path="/" element={
                    !session ? <Navigate to="/login" /> : <Navigate to="/dashboard" />
                } />

                <Route path="/dashboard" element={
                    !session ? <Navigate to="/login" /> : <DashboardPage session={session} />
                } />
                <Route path="/self-sign" element={
                    !session ? <Navigate to="/login" /> : <SelfSignPage session={session} />
                } />
                <Route path="/compose" element={
                    !session ? <Navigate to="/login" /> : <ComposePage />
                } />
                <Route path="/pricing" element={
                    !session ? <Navigate to="/login" /> : <PricingPage />
                } />
                <Route path="/my-signatures" element={
                    !session ? <Navigate to="/login" /> : <MySignaturesPage />
                } />
                <Route path="/subscription" element={
                    !session ? <Navigate to="/login" /> : <SubscriptionPage />
                } />
                <Route path="/start" element={
                    !session ? <Navigate to="/login" /> : <UnifiedStartPage />
                } />
                <Route path="/tools/ai-assistant" element={
                    !session ? <Navigate to="/login" /> : <AIAssistantPage session={session} />
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
