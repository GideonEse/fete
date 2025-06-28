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
  faceDescriptor?: number[]; // For face-api.js
}

// This Attendee type is for the LIVE session and history. Avatar is optional.
export interface Attendee {
  id: string;
  name: string;
  matricNumber?: string;
  memberType: 'student' | 'staff';
  avatar?: string; // Optional: present for live view, absent for history
  time: string;
  status: 'On-time' | 'Late';
  exitTime?: string;
}

export interface Session {
  id: string;
  isActive: boolean;
  startTime: number;
  attendees: Attendee[];
  mode: 'entry' | 'exit';
}

interface AppContextType {
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'avatar'> & { facialImage?: string }) => { success: boolean, message: string };
  loggedInUser: Member | null;
  login: (identifier: string, password: string, memberType: string) => { success: boolean, message: string };
  logout: () => void;
  currentSession: Session | null;
  sessionHistory: Session[];
  startSession: () => void;
  startExitScan: () => void;
  endSession: () => void;
  addAttendee: (memberId: string) => void;
  isInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialMembers: Member[] = [
    {
        id: 'admin_user',
        name: 'Admin',
        memberType: 'admin',
        password: 'password',
        avatar: `https://placehold.co/100x100.png`
    }
];

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
      if (storedMembers) {
        setMembers(JSON.parse(storedMembers));
      } else {
        setMembers(initialMembers);
      }

      const storedHistory = localStorage.getItem('veriattend_sessionHistory');
      if (storedHistory) {
        const loadedHistory: Session[] = JSON.parse(storedHistory);
        // Proactively slim down any history we load to fix existing quota issues
        const slimHistory = loadedHistory.map(session => {
            const slimSession = { ...session };
            slimSession.attendees = session.attendees.map(attendee => {
                const { avatar, faceDescriptor, password, ...rest } = attendee as any;
                return rest;
            });
            return slimSession;
        });
        setSessionHistory(slimHistory);
      }
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
      setMembers(initialMembers);
      setSessionHistory([]);
    }
    setIsInitialized(true);
  }, []);

  // Save members to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('veriattend_members', JSON.stringify(members));
    }
  }, [members, isInitialized]);

  // Save session history to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('veriattend_sessionHistory', JSON.stringify(sessionHistory));
      } catch (error) {
        console.error("Failed to save session history to localStorage:", error);
      }
    }
  }, [sessionHistory, isInitialized]);
  

  const addMember = (memberData: Omit<Member, 'id' | 'avatar'> & { facialImage?: string }) => {
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

    const { facialImage, ...restOfData } = memberData;

    const newMember: Member = {
      ...(restOfData as Omit<Member, 'id' | 'avatar'>),
      id: new Date().toISOString(),
      avatar: facialImage || `https://placehold.co/100x100.png`,
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
    router.push('/');
  };

  const startSession = () => {
    setCurrentSession({
      id: new Date().toISOString(),
      isActive: true,
      startTime: Date.now(),
      attendees: [],
      mode: 'entry',
    });
  };

  const startExitScan = () => {
    setCurrentSession(prev => prev ? { ...prev, mode: 'exit' } : null);
  };

  const endSession = () => {
    if (currentSession) {
      const finishedSession: Session = JSON.parse(JSON.stringify(currentSession));
      finishedSession.isActive = false;
      
      // Slim down for history by removing the optional avatar
      finishedSession.attendees.forEach((attendee) => {
        delete attendee.avatar;
      });

      setSessionHistory(prev => [finishedSession, ...prev]);
      setCurrentSession(null);
    }
  };
  
  const addAttendee = (memberId: string) => {
      if (!currentSession || !currentSession.isActive) return;
      
      const member = members.find(m => m.id === memberId);
      if (!member) return;
      
      if (currentSession.mode === 'exit') {
        setCurrentSession(prev => {
          if (!prev) return null;
          const now = new Date();
          const exitTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          const updatedAttendees = prev.attendees.map(a => {
            if (a.id === memberId && !a.exitTime) {
              return { ...a, exitTime: exitTime };
            }
            return a;
          });

          if (JSON.stringify(updatedAttendees) !== JSON.stringify(prev.attendees)) {
              return { ...prev, attendees: updatedAttendees };
          }
          return prev;
        });
        return;
      }
      
      const alreadyExists = currentSession.attendees.some(a => a.id === memberId);
      if(alreadyExists) return;

      const now = new Date();
      const arrivalTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isLate = (now.getTime() - currentSession.startTime) > (15 * 60 * 1000); 

      // Create a new attendee object, including the avatar for the live view.
      // This will be stripped out before saving to history.
      const newAttendee: Attendee = {
        id: member.id,
        name: member.name,
        matricNumber: member.matricNumber,
        memberType: member.memberType as 'student' | 'staff',
        avatar: member.avatar,
        time: arrivalTime,
        status: isLate ? 'Late' : 'On-time',
      };
      
      setCurrentSession(prev => prev ? { ...prev, attendees: [newAttendee, ...prev.attendees] } : null);
  };


  return (
    <AppContext.Provider value={{ members, addMember, loggedInUser, login, logout, currentSession, sessionHistory, startSession, startExitScan, endSession, addAttendee, isInitialized }}>
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
