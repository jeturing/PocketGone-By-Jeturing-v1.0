import { UserSession } from '../types';

// Mock storage key
const SESSION_KEY = 'pocketgone_session';

export const login = async (accessCode: string): Promise<UserSession | null> => {
  // Mock validation - in real app, hit backend
  await new Promise(r => setTimeout(r, 800)); // Simulate delay

  if (accessCode === 'admin' || accessCode === 'student') {
    const session: UserSession = {
      username: accessCode === 'admin' ? 'Prof. Falken' : 'Student Unit 1',
      role: accessCode === 'admin' ? 'PROFESSOR' : 'STUDENT',
      isAuthenticated: true,
      onboardingComplete: true
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getSession = (): UserSession | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};