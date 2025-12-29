// A conceptual mock of ThemeContext.js (Assumed to exist for this feature)
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Reads from localStorage or defaults to 'dark'
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    const toggleTheme = () => {
        setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
    };

    useEffect(() => {
        localStorage.setItem('theme', theme);
        // This is the critical part: applying the class to the <body> or root element
        document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};