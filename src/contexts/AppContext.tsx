import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, logout } from '../services/firebaseAuth';
import { ensureUserProfile, subscribeToUserRole, subscribeToAccessRequests, UserRole } from '../services/firebaseUsers';
import { initializeDefaultTeamsGroups, addTeamsGroup, updateTeamsGroup, deleteTeamsGroup, getTeamsGroups, TeamsGroup } from '../services/firebaseConfig';
import { subscribeToNotifications, markNotificationAsRead, Notification } from '../services/firebaseNotifications';
import { useReleases } from '../hooks/useReleases';
import { Release } from '../types/release';

interface AppContextType {
  // Auth
  user: User | null;
  userRole: UserRole;
  isAdmin: boolean;
  canEdit: boolean;
  handleLogout: () => Promise<void>;
  getDisplayName: (user: User | null) => string;

  // Dark mode
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Releases
  releases: Release[];
  releasesLoading: boolean;
  saving: boolean;
  saveError: string | null;
  addRelease: (release: Omit<Release, 'id'>) => Promise<void>;
  updateRelease: (id: string, release: Partial<Release>) => Promise<void>;
  deleteRelease: (id: string) => Promise<void>;

  // Teams groups
  teamsGroups: TeamsGroup[];
  handleAddTeamsGroup: (name: string, url: string) => Promise<void>;
  handleUpdateTeamsGroup: (id: string, name: string, url: string) => Promise<void>;
  handleDeleteTeamsGroup: (id: string) => Promise<void>;

  // Notifications
  notifications: Notification[];
  handleDismissNotifications: () => Promise<string>;

  // Access requests
  accessRequestCount: number;

  // Toast
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { releases, loading: releasesLoading, saving, saveError, addRelease, updateRelease, deleteRelease } = useReleases();

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [darkMode, setDarkMode] = useState(false);
  const [teamsGroups, setTeamsGroups] = useState<TeamsGroup[]>([]);
  const [accessRequestCount, setAccessRequestCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';
  const canEdit = userRole === 'admin' || userRole === 'editor';

  // Auth listener
  useEffect(() => {
    let roleUnsubscribe: (() => void) | undefined;

    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        try {
          await ensureUserProfile(authUser.uid, authUser.email || '');
          roleUnsubscribe = subscribeToUserRole(authUser.uid, (role) => {
            setUserRole(role);
          });
        } catch (error) {
          console.error('Error setting up user profile:', error);
        }
      } else {
        setUserRole('viewer');
        if (roleUnsubscribe) {
          roleUnsubscribe();
          roleUnsubscribe = undefined;
        }
      }
    });

    return () => {
      unsubscribe();
      if (roleUnsubscribe) roleUnsubscribe();
    };
  }, []);

  // Dark mode
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Teams groups
  useEffect(() => {
    const load = async () => {
      try {
        const groups = await initializeDefaultTeamsGroups();
        setTeamsGroups(groups);
      } catch (error) {
        console.error('Error loading teams groups:', error);
      }
    };
    load();
  }, []);

  // Access requests
  useEffect(() => {
    if (!isAdmin) {
      setAccessRequestCount(0);
      return;
    }
    const unsubscribe = subscribeToAccessRequests(
      (requests) => setAccessRequestCount(requests.length),
      (error) => console.error('Error fetching access requests:', error)
    );
    return () => unsubscribe();
  }, [isAdmin]);

  // Notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const unsubscribe = subscribeToNotifications(
      user.uid,
      (notifs) => setNotifications(notifs),
      (error) => console.error('Error fetching notifications:', error)
    );
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    setUserRole('viewer');
    setUser(null);
  };

  const getDisplayName = (u: User | null) => {
    if (!u) return '';
    const email = u.email || '';
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleAddTeamsGroup = async (name: string, url: string) => {
    await addTeamsGroup(name, url, user?.email || undefined);
    const groups = await getTeamsGroups();
    setTeamsGroups(groups);
  };

  const handleUpdateTeamsGroup = async (id: string, name: string, url: string) => {
    await updateTeamsGroup(id, name, url, user?.email || undefined);
    const groups = await getTeamsGroups();
    setTeamsGroups(groups);
  };

  const handleDeleteTeamsGroup = async (id: string) => {
    await deleteTeamsGroup(id, user?.email || undefined);
    const groups = await getTeamsGroups();
    setTeamsGroups(groups);
  };

  const handleDismissNotifications = async (): Promise<string> => {
    if (notifications.length > 0) {
      const messages = notifications.map((n) => n.message).join('\n• ');
      await Promise.all(notifications.map((n) => markNotificationAsRead(n.id)));
      setNotifications([]);
      return `• ${messages}`;
    }
    return 'No new notifications';
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userRole,
        isAdmin,
        canEdit,
        handleLogout,
        getDisplayName,
        darkMode,
        toggleDarkMode,
        releases,
        releasesLoading,
        saving,
        saveError,
        addRelease,
        updateRelease,
        deleteRelease,
        teamsGroups,
        handleAddTeamsGroup,
        handleUpdateTeamsGroup,
        handleDeleteTeamsGroup,
        notifications,
        handleDismissNotifications,
        accessRequestCount,
        toastMessage,
        setToastMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
