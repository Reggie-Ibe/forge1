// src/contexts/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';

// Create auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is already logged in (using localStorage)
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user data', error);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      // In a real app, this would be an API call
      // For testing purposes, use hardcoded credentials or JSON server
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/users?email=${email}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const users = await response.json();
      
      if (users.length > 0 && users[0].password === password) {
        // Remove the password from the user object before storing
        const { password: _, ...userWithoutPassword } = users[0];
        setUser(userWithoutPassword);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        return { success: true };
      }
      return { success: false, message: 'Invalid email or password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again later.' };
    }
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  // Register function (for future implementation)
  const register = async (userData) => {
    try {
      // This would be an API call in a real app
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register,
      loading, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);