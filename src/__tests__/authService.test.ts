import { signUp, login, logout, sendPasswordReset, deleteAccountAndData } from '../services/authService';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { collection, getDocs, query, where, deleteDoc, doc, setDoc, writeBatch } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('../services/firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../utils/errorReporting', () => ({
  captureError: jest.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // writeBatch mock - batch.delete ve batch.commit için
    (writeBatch as jest.Mock).mockReturnValue({
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    });
  });

  describe('signUp', () => {
    it('should create user and set profile', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      const mockCredential = { user: mockUser };
      
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await signUp('test@example.com', 'password123', 'Test User');

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
      expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
      expect(result).toBe(mockUser);
    });

    it('should handle signup errors', async () => {
      const error = new Error('Email already in use');
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(signUp('test@example.com', 'password123', 'Test User')).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should sign in user with email and password', async () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });

      await login('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(login('test@example.com', 'wrongpassword')).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should sign out user', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      await logout();

      expect(signOut).toHaveBeenCalledWith(auth);
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await sendPasswordReset('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
    });
  });

  describe('deleteAccountAndData', () => {
    it('should delete user account and all data', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };
      
      const mockQuerySnapshot = {
        docs: [
          { ref: { id: 'doc1' } },
          { ref: { id: 'doc2' } },
        ],
      };

      (reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      (deleteUser as jest.Mock).mockResolvedValue(undefined);

      await deleteAccountAndData(mockUser as any, 'password123');

      expect(reauthenticateWithCredential).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalledTimes(4); // userTargets, userSavedStops, userAlarmProfiles, alarmSessions
      expect(deleteUser).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error if user email is missing', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: null,
      };

      await expect(deleteAccountAndData(mockUser as any, 'password123')).rejects.toThrow('Kullanıcı email adresi bulunamadı');
    });
  });
});

