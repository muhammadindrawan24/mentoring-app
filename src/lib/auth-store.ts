'use client';

import { create } from 'zustand';
import { User, Mentor } from '@/types';
import { MOCK_USERS, MOCK_MENTORS } from '@/lib/mock-data';
import { verifyPassword } from '@/lib/password';

interface AuthState {
  user: User | null;
  mentorProfile: Mentor | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  initializeAuth: () => void;
}

function pickMentorProfile(user: User): Mentor | null {
  if (user.role !== 'MENTOR') return null;
  return MOCK_MENTORS.find((m) => m.user_id === user.user_id) || null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  mentorProfile: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.status === 'ACTIVE'
    );

    if (!user) {
      return { success: false, message: 'Email atau password salah.' };
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return { success: false, message: 'Email atau password salah.' };
    }

    const token = `session_token_${user.user_id}_${Date.now()}`;
    const mentor = pickMentorProfile(user);

    // Jangan simpan hash password di localStorage
    const sessionUser: User = { ...user, password_hash: '' };

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(sessionUser));
    if (mentor) {
      localStorage.setItem('auth_mentor', JSON.stringify(mentor));
    } else {
      localStorage.removeItem('auth_mentor');
    }
    localStorage.removeItem('auth_mentee');

    set({
      user: sessionUser,
      mentorProfile: mentor,
      token,
      isAuthenticated: true,
    });

    return { success: true, message: 'Login berhasil.' };
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_mentor');
    localStorage.removeItem('auth_mentee');
    set({
      user: null,
      mentorProfile: null,
      token: null,
      isAuthenticated: false,
    });
  },

  initializeAuth: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    const mentorStr = localStorage.getItem('auth_mentor');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        const mentorProfile = mentorStr ? JSON.parse(mentorStr) as Mentor : null;
        set({
          user,
          mentorProfile,
          token,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_mentor');
        localStorage.removeItem('auth_mentee');
      }
    }
  },
}));
