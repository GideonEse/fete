'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Types
export interface Member {
  id: string;
  name: string;
  matricNumber?: string; // Optional for admin
  password?: string;
  memberType: 'student' | 'staff' | 'admin';
  avatar: string;
  facialImage?: string; // Data URI
}

export interface Attendee extends Member {
  time: string;
  status: 'On-time' | 'Late';
}

export interface Session {
  id: string;
  isActive: boolean;
  startTime: number;
  attendees: Attendee[];
}

interface AppContextType {
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'avatar'>) => { success: boolean, message: string };
  loggedInUser: Member | null;
  login: (identifier: string, password: string, memberType: string) => { success: boolean, message: string };
  logout: () => void;
  currentSession: Session | null;
  sessionHistory: Session[];
  startSession: () => void;
  stopSession: () => void;
  addAttendee: (memberId: string) => void;
  isInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<Member | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  
  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const storedMembers = localStorage.getItem('veriattend_members');
      const storedUser = localStorage.getItem('veriattend_loggedInUser');
      const storedSession = localStorage.getItem('veriattend_currentSession');
      const storedHistory = localStorage.getItem('veriattend_sessionHistory');
      
      let initialMembers: Member[] = storedMembers ? JSON.parse(storedMembers) : [];
      // Ensure there's always an admin user for the demo
      if (!initialMembers.some(m => m.memberType === 'admin')) {
          initialMembers.push({
              id: 'admin_user',
              name: 'Admin',
              memberType: 'admin',
              password: 'password',
              avatar: `https://placehold.co/100x100.png`
          });
      }
      setMembers(initialMembers);

      if (storedUser) setLoggedInUser(JSON.parse(storedUser));
      if (storedSession) setCurrentSession(JSON.parse(storedSession));
      if (storedHistory) setSessionHistory(JSON.parse(storedHistory));

    } catch (error) {
        console.error("Failed to parse localStorage data", error);
        // If parsing fails, start fresh
        setMembers([{
              id: 'admin_user',
              name: 'Admin',
              memberType: 'admin',
              password: 'password',
              avatar: `https://placehold.co/100x100.png`
          }]);
        setLoggedInUser(null);
        setCurrentSession(null);
        setSessionHistory([]);
    }
    setIsInitialized(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if(isInitialized) {
        localStorage.setItem('veriattend_members', JSON.stringify(members));
        if (loggedInUser) {
            localStorage.setItem('veriattend_loggedInUser', JSON.stringify(loggedInUser));
        } else {
            localStorage.removeItem('veriattend_loggedInUser');
        }
        if (currentSession) {
            localStorage.setItem('veriattend_currentSession', JSON.stringify(currentSession));
        } else {
            localStorage.removeItem('veriattend_currentSession');
        }
        localStorage.setItem('veriattend_sessionHistory', JSON.stringify(sessionHistory));
    }
  }, [members, loggedInUser, currentSession, sessionHistory, isInitialized]);

  const addMember = (memberData: Omit<Member, 'id' | 'avatar'>) => {
    if (memberData.memberType !== 'admin') {
      const existingMember = members.find(m => m.matricNumber === memberData.matricNumber);
      if (existingMember) {
        return { success: false, message: 'A member with this matric number already exists.' };
      }
    } else {
       const existingAdmin = members.find(m => m.name.toLowerCase() === memberData.name.toLowerCase() && m.memberType === 'admin');
        if (existingAdmin) {
            return { success: false, message: 'An admin with this username already exists.' };
        }
    }

    const newMember: Member = {
      ...memberData,
      id: new Date().toISOString(),
      avatar: `https://placehold.co/100x100.png`,
    };
    setMembers(prev => [...prev, newMember]);
    return { success: true, message: `Member ${newMember.name} registered successfully!` };
  };

  const login = (identifier: string, password: string, memberType: string) => {
    const user = members.find(m =>
      m.memberType === memberType &&
      (memberType === 'admin' ? m.name.toLowerCase() === identifier.toLowerCase() : m.matricNumber === identifier)
    );

    if (user && user.password === password) {
      setLoggedInUser(user);
      return { success: true, message: 'Login successful!' };
    }
    return { success: false, message: 'Invalid credentials. Please try again.' };
  };

  const logout = () => {
    setLoggedInUser(null);
    router.push('/register');
  };

  const startSession = () => {
    setCurrentSession({
      id: new Date().toISOString(),
      isActive: true,
      startTime: Date.now(),
      attendees: [],
    });
  };

  const stopSession = () => {
    if (currentSession) {
      const finishedSession = { ...currentSession, isActive: false };
      setSessionHistory(prev => [finishedSession, ...prev]);
      setCurrentSession(null);
    }
  };
  
  const addAttendee = (memberId: string) => {
      const member = members.find(m => m.id === memberId);
      if (!member || !currentSession || !currentSession.isActive) return;

      const alreadyExists = currentSession.attendees.some(a => a.id === memberId);
      if(alreadyExists) return;

      const now = new Date();
      const arrivalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Late if more than 15 mins past session start
      const isLate = (now.getTime() - currentSession.startTime) > (15 * 60 * 1000); 

      const newAttendee: Attendee = {
        ...member,
        time: arrivalTime,
        status: isLate ? 'Late' : 'On-time',
      };
      
      setCurrentSession(prev => prev ? { ...prev, attendees: [newAttendee, ...prev.attendees] } : null);
  };


  return (
    <AppContext.Provider value={{ members, addMember, loggedInUser, login, logout, currentSession, sessionHistory, startSession, stopSession, addAttendee, isInitialized }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
