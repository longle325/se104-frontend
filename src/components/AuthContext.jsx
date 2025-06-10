import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = Cookies.get('access_token');
    if (token) {
      setIsAuthenticated(true);
      const userData = Cookies.get('user_data');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Load updated profile data to get avatar and latest full_name
        loadUserProfile(parsedUser.username, token);
      }
    }
    setLoading(false);
  }, []);

  const loadUserProfile = async (username, token) => {
    try {
      const response = await fetch(`http://localhost:8000/profile/${username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setUser(prevUser => {
          const updatedUser = {
            ...prevUser,
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            student_id: profileData.student_id
          };
          Cookies.set('user_data', JSON.stringify(updatedUser), { expires: 1 });
          return updatedUser;
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = (userData, token) => {
    Cookies.set('access_token', token, { expires: 1 }); // 1 day
    Cookies.set('user_data', JSON.stringify(userData), { expires: 1 });
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user_data');
    setUser(null);
    setIsAuthenticated(false);
  };

  const getAuthHeader = () => {
    const token = Cookies.get('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Get token for WebSocket authentication
  const getToken = () => {
    return Cookies.get('access_token');
  };

  const value = {
    user,
    currentUser: user, // Alias for compatibility with ChatPage
    token: getToken(), // Direct token access for WebSocket
    isAuthenticated,
    loading,
    login,
    logout,
    getAuthHeader,
    getToken,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 