import React, { createContext, useContext, useState } from 'react';

const SessionContext = createContext();

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};

export const SessionProvider = ({ children }) => {
    const [currentSession, setCurrentSession] = useState(null);

    const value = {
        currentSession,
        setCurrentSession
    };

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

export default SessionContext;
