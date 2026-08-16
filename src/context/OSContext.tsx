import React, { createContext, useContext, useState, useEffect } from 'react';
import { FSNode, OSWindow, NotificationToast, OSTheme, OSSettings } from '../types';

interface OSContextType {
  fileSystem: FSNode[];
  windows: OSWindow[];
  activeWindowId: string | null;
  settings: OSSettings;
  notifications: NotificationToast[];
  notificationHistory: (NotificationToast & { timestamp: string })[];
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  isAIPending: boolean;
  currentExplorerPath: string;
  isStartMenuOpen: boolean;
  isQuickSettingsOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  createFile: (path: string, content: string) => void;
  createDirectory: (path: string) => void;
  deleteItem: (path: string) => void;
  renameItem: (path: string, newName: string) => void;
  openWindow: (appId: string, args?: any) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  setTheme: (theme: OSTheme) => void;
  setAccentColor: (color: string) => void;
  setWallpaper: (wallpaper: string) => void;
  updateSettings: (newSettings: Partial<OSSettings>) => void;
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  dismissNotification: (id: string) => void;
  clearNotificationHistory: () => void;
  sendAICommand: (prompt: string) => Promise<string>;
  clearChatHistory: () => void;
  setCurrentExplorerPath: (path: string) => void;
  setIsStartMenuOpen: (isOpen: boolean) => void;
  setIsQuickSettingsOpen: (isOpen: boolean) => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  setSearchQuery: (query: string) => void;
  currentUser: any;
  isFirebaseActive: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

const WALLPAPER_PRESETS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80', // Glassy Pastel Bloom
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&q=80', // Dark Synthwave Sky
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1600&q=80', // Vibrant Abstract Fluid
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&q=80', // High Contrast Art
];

const INITIAL_FS: FSNode[] = [
  {
    name: "Documents",
    type: "directory",
    path: "/Documents",
    parentPath: "/",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Pictures",
    type: "directory",
    path: "/Pictures",
    parentPath: "/",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Downloads",
    type: "directory",
    path: "/Downloads",
    parentPath: "/",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Desktop",
    type: "directory",
    path: "/Desktop",
    parentPath: "/",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Welcome_Guide.txt",
    type: "file",
    path: "/Documents/Welcome_Guide.txt",
    parentPath: "/Documents",
    content: `=========================================
  WELCOME TO THE AI-INTERACTIVE DESKTOP OS
=========================================

This is a web simulated, high-fidelity operating system. Every application operates with proper functionality, including persistent local storage saving!

✨ CO-PILOT SYSTEM INTEGRATION (AI INTERACTIVE)
-----------------------------------------------
Your Lumina AI (on the right or launched via Start) is directly connected to the system. You can issue prompts like:
- "Create a file named ideas.txt on my Desktop with cool content"
- "Open Notepad to write a quick poem"
- "Open Paint" or "Launch Calculator"
- "Change the theme to light mode"
- "Search the web for the latest NASA discoveries"

🎮 INTEGRATED APPLICATIONS
-------------------------
1. FILE EXPLORER: Create folders, delete items, navigate directories, and double-click files. Double-clicking .txt files opens them in Notepad; double-clicking saved canvas renders they will load in Image Viewer!
2. NOTEPAD: Fully functional text editor. Hit 'Save' to save direct to the Virtual File System!
3. PAINT: Create layouts, draw on HTML5 Canvas. Includes size settings, erasers, paint palette, and direct saves!
4. WEB BROWSER: Search or browse. Fully operational mock navigation with AI Search capability powered by Gemini.
5. TERMINAL: Functional Shell console. Use commands: cd, ls, cat, mkdir, rm, help, clear, or directly write script logs!
6. CALCULATOR: Complete operation set, responsive visual feedback.
7. SETTINGS: Customize accent colors, swap theme aesthetics (Glassmorphism, Dark, Light), and configure wallpapers!

Enjoy exploring of this futuristic workspace!`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Todo_List.txt",
    type: "file",
    path: "/Documents/Todo_List.txt",
    parentPath: "/Documents",
    content: `- Explore File Explorer directories
- Test the terminal CLI with 'help' and 'ls'
- Ask Lumina AI to automatically write a python script file in my Desktop
- Draw a nice picture in Paint and save it to the virtual drive
- Alter OS theme styles inside the Settings application`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings
  const [settings, setSettings] = useState<OSSettings>(() => {
    const stored = localStorage.getItem('os_settings');
    const defaultSettings: OSSettings = {
      theme: 'dark',
      accentColor: '#0078d4', // Microsoft blue
      wallpaper: WALLPAPER_PRESETS[0],
      systemSound: true,
      username: 'Administrator',
      brightness: 100,
      scale: 100,
      nightLight: false,
      nightLightStrength: 40,
      aiPersona: 'balanced',
      aiVoiceSpeed: 1.0,
      powerPlan: 'balanced',
      sleepTimer: 15,
      wifiOn: true,
      vpnActive: false,
      bluetoothOn: true,
      dnsServer: '8.8.8.8 (Google Public DNS)',
      lockEnabled: false,
      lockPassword: '',
      windowsUpdated: false,
      firewallActive: true,
      volume: 80,
      refreshRate: 60,
    };
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed };
      } catch { /* fail ok */ }
    }
    return defaultSettings;
  });

  // Save settings
  useEffect(() => {
    localStorage.setItem('os_settings', JSON.stringify(settings));
  }, [settings]);

  // Load filesystem
  const [fileSystem, setFileSystem] = useState<FSNode[]>(() => {
    const stored = localStorage.getItem('os_fs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* ok */ }
    }
    return INITIAL_FS;
  });

  // Save filesystem
  useEffect(() => {
    localStorage.setItem('os_fs', JSON.stringify(fileSystem));
  }, [fileSystem]);

  // Windows management
  const [windows, setWindows] = useState<OSWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  // Miscellaneous OS State
  const [notifications, setNotifications] = useState<NotificationToast[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<(NotificationToast & { timestamp: string })[]>(() => {
    const saved = localStorage.getItem('os_notification_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch { /* ok */ }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('os_notification_history', JSON.stringify(notificationHistory));
  }, [notificationHistory]);

  const [currentExplorerPath, setCurrentExplorerPath] = useState<string>('/Documents');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Lumina AI state
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>(() => {
    const saved = localStorage.getItem('os_copilot_history');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ok */ }
    }
    return [{
      role: 'assistant',
      content: 'Hello! I am your Windows Lumina AI, fully integrated into this desktop system. You can ask me to help with calculations, browse the web, create system logs, write files to your drives, or launch applications directly! How can I assist your workflow today?'
    }];
  });

  const [isAIPending, setIsAIPending] = useState(false);

  // Firebase auth & cloud synchronization states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);

  // Firestore specific error details builder conforming to AI Studio system expectations
  const handleFirestoreError = (error: unknown, operationType: string, path: string | null, authUser: any) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      operationType,
      path,
      authInfo: {
        userId: authUser?.uid || null,
        email: authUser?.email || null,
        emailVerified: authUser?.emailVerified || null,
        isAnonymous: authUser?.isAnonymous || null,
        tenantId: authUser?.tenantId || null,
        providerInfo: authUser?.providerData?.map((p: any) => ({
          providerId: p.providerId,
          email: p.email
        })) || []
      }
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    // Import from our local firebase initializer
    import('../firebase').then(async ({ auth, db, isConfigReal }) => {
      setIsFirebaseActive(isConfigReal);
      if (!isConfigReal || !auth || !db) return;

      const { doc, getDoc, setDoc } = await import('firebase/firestore');

      // Listen to Auth State changes
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
        if (firebaseUser) {
          setCurrentUser(firebaseUser);
          addNotification('Signed In', `Signed in as ${firebaseUser.displayName || 'Google Cloud User'}!`, 'success');

          const userPath = `users/${firebaseUser.uid}`;
          try {
            // Check if profile document exists in Firestore
            const docRef = doc(db, 'users', firebaseUser.uid);
            let docSnap;
            try {
              docSnap = await getDoc(docRef);
            } catch (snapErr) {
              handleFirestoreError(snapErr, 'get', userPath, firebaseUser);
              return;
            }

            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.fileSystem && Array.isArray(data.fileSystem)) {
                setFileSystem(data.fileSystem);
              }
              if (data.theme) {
                setSettings(prev => ({
                  ...prev,
                  theme: data.theme,
                  accentColor: data.accentColor || prev.accentColor,
                  wallpaper: data.wallpaper || prev.wallpaper,
                  username: firebaseUser.displayName || prev.username
                }));
              }
              if (data.chatHistory) {
                setChatHistory(data.chatHistory);
              }
              addNotification('Desktop Synchronized', 'Loaded files and desktop presets from Firestore Cloud Storage!', 'success');
            } else {
              // Create user profile on Firestore with current device state
              try {
                await setDoc(docRef, {
                  uid: firebaseUser.uid,
                  fileSystem: fileSystem,
                  theme: settings.theme,
                  accentColor: settings.accentColor,
                  wallpaper: settings.wallpaper,
                  chatHistory: chatHistory,
                  updatedAt: new Date().toISOString()
                });
              } catch (writeErr) {
                handleFirestoreError(writeErr, 'write', userPath, firebaseUser);
                return;
              }
              addNotification('Config Backed Up', 'Cloud replica initialized successfully in Firestore.', 'info');
            }
          } catch (err: any) {
            console.error("Error retrieving Firestore state", err);
          }
        } else {
          setCurrentUser(null);
        }
      });

      return () => unsubscribe();
    }).catch(err => console.log("Cloud services loaded in dry-mode.", err));
  }, []);

  // Sync to Cloud Storage upon state modifications (auto-save with debouncing)
  useEffect(() => {
    if (!currentUser) return;

    const delayDebounceSelector = setTimeout(async () => {
      const userPath = `users/${currentUser.uid}`;
      try {
        const { db } = await import('../firebase');
        const { doc, setDoc } = await import('firebase/firestore');
        if (!db) return;

        const docRef = doc(db, 'users', currentUser.uid);
        try {
          await setDoc(docRef, {
            uid: currentUser.uid,
            fileSystem,
            theme: settings.theme,
            accentColor: settings.accentColor,
            wallpaper: settings.wallpaper,
            chatHistory,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (writeErr) {
          handleFirestoreError(writeErr, 'write', userPath, currentUser);
          return;
        }
        console.log("Cloud Synchronization completed.");
      } catch (err) {
        console.error("Cloud auto-save error:", err);
      }
    }, 2000);

    return () => clearTimeout(delayDebounceSelector);
  }, [fileSystem, settings, chatHistory, currentUser]);

  const loginWithGoogle = async () => {
    try {
      const { auth, googleProvider } = await import('../firebase');
      const { signInWithPopup } = await import('firebase/auth');
      if (!auth || !googleProvider) {
        addNotification('Configuration Required', 'Connect to Firebase using the AI Studio setup interface first.', 'warning');
        return;
      }
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error(e);
      addNotification('Auth Blocked', e.message || 'Verification popup window failed.', 'error');
    }
  };

  const logout = async () => {
    try {
      const { auth } = await import('../firebase');
      const { signOut } = await import('firebase/auth');
      if (auth) {
        await signOut(auth);
        setCurrentUser(null);
        addNotification('Signed Out', 'Cloud session terminated safely.', 'info');
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  useEffect(() => {
    localStorage.setItem('os_copilot_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNotifications(prev => [...prev, { id, title, message, type, duration: 4000 }]);
    setNotificationHistory(prev => [{ id, title, message, type, timestamp }, ...prev].slice(0, 50));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotificationHistory = () => {
    setNotificationHistory([]);
  };

  // Filesystem implementations
  const createFile = (filePath: string, content: string) => {
    setFileSystem(prev => {
      // Check if file already exists
      const existingIdx = prev.findIndex(item => item.path === filePath && item.type === 'file');
      const segments = filePath.split('/');
      const name = segments[segments.length - 1];
      const parentPath = segments.slice(0, -1).join('/') || '/';

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          content,
          updatedAt: new Date().toISOString(),
          size: content ? content.length : 0
        };
        return updated;
      }

      const newNode: FSNode = {
        name,
        type: 'file',
        path: filePath,
        parentPath: parentPath === '' ? '/' : parentPath,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        size: content ? content.length : 0
      };
      return [...prev, newNode];
    });

    // Notify user
    const parts = filePath.split('/');
    addNotification('File Created', `Saved "${parts[parts.length - 1]}" successfully!`, 'success');
  };

  const createDirectory = (dirPath: string) => {
    setFileSystem(prev => {
      const existingIdx = prev.findIndex(item => item.path === dirPath && item.type === 'directory');
      if (existingIdx !== -1) return prev; // folder exists

      const segments = dirPath.split('/');
      const name = segments[segments.length - 1];
      const parentPath = segments.slice(0, -1).join('/') || '/';

      const newNode: FSNode = {
        name,
        type: 'directory',
        path: dirPath,
        parentPath: parentPath === '' ? '/' : parentPath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return [...prev, newNode];
    });

    const parts = dirPath.split('/');
    addNotification('Folder Created', `Created folder "${parts[parts.length - 1]}"`, 'info');
  };

  const deleteItem = (itemPath: string) => {
    setFileSystem(prev => {
      // Filter out this node and any children if it is a directory
      return prev.filter(node => {
        if (node.path === itemPath) return false;
        // Check if it is a child process
        if (node.path.startsWith(itemPath + '/')) return false;
        return true;
      });
    });
    const parts = itemPath.split('/');
    addNotification('Deleted', `Permanently deleted "${parts[parts.length - 1]}"`, 'warning');
  };

  const renameItem = (itemPath: string, newName: string) => {
    if (!newName || newName.includes('/')) return;

    setFileSystem(prev => {
      const targetIdx = prev.findIndex(node => node.path === itemPath);
      if (targetIdx === -1) return prev;

      const oldNode = prev[targetIdx];
      const segments = oldNode.path.split('/');
      segments[segments.length - 1] = newName;
      const newPath = segments.join('/');

      const result = prev.map((node, idx) => {
        if (idx === targetIdx) {
          return {
            ...node,
            name: newName,
            path: newPath,
            updatedAt: new Date().toISOString()
          };
        }
        // Update children paths if directory
        if (oldNode.type === 'directory' && node.path.startsWith(itemPath + '/')) {
          const relativePart = node.path.slice(itemPath.length);
          return {
            ...node,
            path: newPath + relativePart,
            parentPath: node.parentPath.startsWith(itemPath) 
              ? newPath + node.parentPath.slice(itemPath.length) 
              : node.parentPath,
            updatedAt: new Date().toISOString()
          };
        }
        return node;
      });
      return result;
    });
  };

  // Windows management implementations
  const getAppMeta = (appId: string) => {
    switch (appId) {
      case 'explorer': return { title: 'File Explorer', iconName: 'FolderClosed', width: 880, height: 560 };
      case 'notepad': return { title: 'Notepad', iconName: 'FileText', width: 800, height: 520 };
      case 'paint': return { title: 'Paint Drawing Studio', iconName: 'Palette', width: 960, height: 620 };
      case 'browser': return { title: 'Google Chrome', iconName: 'Globe', width: 960, height: 600 };
      case 'calc': return { title: 'Calculator', iconName: 'Calculator', width: 340, height: 480 };
      case 'settings': return { title: 'Settings', iconName: 'Settings', width: 860, height: 580 };
      case 'terminal': return { title: 'Terminal', iconName: 'Terminal', width: 820, height: 520 };
      case 'copilot': return { title: 'Lumina AI', iconName: 'Sparkles', width: 400, height: 620 };
      case 'voice': return { title: 'Gemini Live Voice Link', iconName: 'Mic', width: 560, height: 580 };
      case 'sysmon': return { title: 'System Monitor', iconName: 'Activity', width: 840, height: 540 };
      case 'maps': return { title: 'Lumina Maps', iconName: 'Compass', width: 920, height: 580 };
      default: return { title: 'Application', iconName: 'Layers', width: 800, height: 520 };
    }
  };

  const openWindow = (appId: string, args?: any): string => {
    // If it is 'copilot', we can open it as a right sidebar or toggle a dedicated floating window.
    // Let's toggle start menu / others shut
    setIsStartMenuOpen(false);
    setIsSearchOpen(false);

    // Calc next zIndex
    const nextZIndex = windows.length > 0 ? Math.max(...windows.map(w => w.zIndex)) + 1 : 10;

    // Check if app already open and is single instance (e.g., settings, copilot, calc)
    const isSingleInstance = ['settings', 'copilot', 'calc', 'paint', 'sysmon', 'synapse'].includes(appId);
    if (isSingleInstance) {
      const existing = windows.find(w => w.appId === appId);
      if (existing) {
        // Bring to front and restore if minimized
        setWindows(prev => prev.map(w => {
          if (w.id === existing.id) {
            return { ...w, isMinimized: false, isOpen: true, zIndex: nextZIndex, args: args || w.args };
          }
          return w;
        }));
        setActiveWindowId(existing.id);
        return existing.id;
      }
    }

    const meta = getAppMeta(appId);
    const id = appId + '_' + Date.now().toString().substr(-6);

    // Initial positioning center screens offset slightly
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const offset = (windows.length % 6) * 25;
    const leftX = Math.max(40, Math.floor((screenWidth - meta.width) / 2) + offset);
    const topY = Math.max(40, Math.floor((screenHeight - meta.height - 48) / 2) + offset);

    const newWindow: OSWindow = {
      id,
      title: meta.title,
      iconName: meta.iconName,
      appId,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
      x: leftX,
      y: topY,
      width: meta.width,
      height: meta.height,
      minWidth: appId === 'calc' ? 280 : 250,
      minHeight: appId === 'calc' ? 380 : 250,
      args
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveWindowId(id);
    return id;
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (activeWindowId === id) {
      // set focus to next highest zIndex window
      const remaining = windows.filter(w => w.id !== id && !w.isMinimized);
      if (remaining.length > 0) {
        const top = remaining.reduce((prevTop, curr) => curr.zIndex > prevTop.zIndex ? curr : prevTop, remaining[0]);
        setActiveWindowId(top.id);
      } else {
        setActiveWindowId(null);
      }
    }
  };

  const minimizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    // Remove focus
    if (activeWindowId === id) {
      const remaining = windows.filter(w => w.id !== id && !w.isMinimized);
      if (remaining.length > 0) {
        const top = remaining.reduce((prevTop, curr) => curr.zIndex > prevTop.zIndex ? curr : prevTop, remaining[0]);
        setActiveWindowId(top.id);
      } else {
        setActiveWindowId(null);
      }
    }
  };

  const maximizeWindow = (id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        const next = !w.isMaximized;
        if (next) {
          // store preceding coordinates
          return {
            ...w,
            isMaximized: true,
            prevX: w.x,
            prevY: w.y,
            prevWidth: w.width,
            prevHeight: w.height,
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight - 48 // Subtract Taskbar height
          };
        } else {
          return {
            ...w,
            isMaximized: false,
            x: w.prevX ?? w.x,
            y: w.prevY ?? w.y,
            width: w.prevWidth ?? w.width,
            height: w.prevHeight ?? w.height
          };
        }
      }
      return w;
    }));
    focusWindow(id);
  };

  const focusWindow = (id: string) => {
    // Bring window to top of active list
    setWindows(prev => {
      const target = prev.find(w => w.id === id);
      if (!target) return prev;
      const maxZ = prev.length > 0 ? Math.max(...prev.map(w => w.zIndex)) : 10;
      if (target.zIndex === maxZ && !target.isMinimized) return prev; // already focused

      return prev.map(w => {
        if (w.id === id) {
          return { ...w, isMinimized: false, zIndex: maxZ + 1 };
        }
        return w;
      });
    });
    setActiveWindowId(id);
  };

  const updateWindowPosition = (id: string, x: number, y: number) => {
    // Avoid updating position for maximized window
    setWindows(prev => prev.map(w => {
      if (w.id === id && !w.isMaximized) {
        return { ...w, x, y };
      }
      return w;
    }));
  };

  const updateWindowSize = (id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id && !w.isMaximized) {
        // Enforce boundaries
        const finalW = Math.max(w.minWidth || 200, width);
        const finalH = Math.max(w.minHeight || 200, height);
        return { ...w, width: finalW, height: finalH };
      }
      return w;
    }));
  };

  // Customization setters
  const setTheme = (theme: OSTheme) => setSettings(prev => ({ ...prev, theme }));
  const setAccentColor = (accentColor: string) => setSettings(prev => ({ ...prev, accentColor }));
  const setWallpaper = (wallpaper: string) => setSettings(prev => ({ ...prev, wallpaper }));
  const updateSettings = (newSettings: Partial<OSSettings>) => setSettings(prev => ({ ...prev, ...newSettings }));

  // AI system integration API proxy dispatcher
  const sendAICommand = async (promptText: string): Promise<string> => {
    if (!promptText.trim()) return '';

    setIsAIPending(true);
    setChatHistory(prev => [...prev, { role: 'user', content: promptText }]);

    try {
      const simplifiedFS = fileSystem.map(node => {
        let contentPreview = undefined;
        if (node.type === 'file') {
          if (node.content?.startsWith('data:image') || node.content?.startsWith('data:application')) {
            contentPreview = `[Binary/Image Data, URL length: ${node.content.length} chars]`;
          } else {
            contentPreview = node.content ? node.content.slice(0, 8000) : '';
          }
        }
        return {
          name: node.name,
          type: node.type,
          path: node.path,
          parentPath: node.parentPath,
          content: contentPreview,
          size: node.size,
          updatedAt: node.updatedAt,
        };
      });

      const response = await fetch('/api/gemini/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          fileSystem: simplifiedFS,
          openApps: windows.map(w => w.appId),
          currentPath: currentExplorerPath,
          theme: settings.theme,
          history: chatHistory.slice(-10) // Send recent conversational interactions
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned code ${response.status}`);
      }

      const resData = await response.json();
      const reply = resData.reply;
      const actions = resData.actions || [];

      // Append assistant's response to chat
      setChatHistory(prev => [...prev, { role: 'assistant', content: reply }]);

      // Process actions sequentially in React OS State
      for (const action of actions) {
        setTimeout(() => {
          try {
            switch (action.type) {
              case 'open_app': {
                openWindow(action.appId, action.args);
                addNotification('Assistant Link Opened', `Lauched tool: ${action.appId}`, 'success');
                break;
              }
              case 'close_app': {
                const targetWindow = windows.find(w => w.appId === action.appId);
                if (targetWindow) closeWindow(targetWindow.id);
                break;
              }
              case 'create_file': {
                createFile(action.path, action.content);
                break;
              }
              case 'delete_file': {
                deleteItem(action.path);
                break;
              }
              case 'rename_file': {
                if (action.path && action.newName) {
                  renameItem(action.path, action.newName);
                  addNotification('File Renamed by AI', `Changed "${action.path.split('/').pop()}" to "${action.newName}"`, 'success');
                }
                break;
              }
              case 'set_wallpaper': {
                if (action.value) {
                  setWallpaper(action.value);
                  addNotification('Wallpaper Updated', 'AI has customized your desktop background Style.', 'success');
                }
                break;
              }
              case 'set_theme': {
                if (action.value === 'light' || action.value === 'dark' || action.value === 'glass') {
                  setTheme(action.value);
                  addNotification('Theme Altered', `Altered interface shade successfully.`, 'info');
                }
                break;
              }
              case 'update_settings': {
                if (action.settings) {
                  updateSettings(action.settings);
                  addNotification('Settings Tuned via AI', 'Desktop variables were adjusted by Lumina AI.', 'success');
                }
                break;
              }
              case 'run_terminal': {
                // If Terminal app is open, we can dispatch logs
                const terminalApp = windows.find(w => w.appId === 'terminal');
                if (!terminalApp) {
                  openWindow('terminal', { autorun: action.content });
                } else {
                  // Re-inject run command argument to focus execution
                  setWindows(prev => prev.map(w => w.id === terminalApp.id ? { ...w, args: { autorun: action.content } } : w));
                  focusWindow(terminalApp.id);
                }
                break;
              }
            }
          } catch (e) {
            console.error("Action handler failed", e);
          }
        }, 300);
      }

      return reply;
    } catch (err: any) {
      console.error(err);
      const errReply = "An error occurred matching your command to the server model: " + err.message;
      setChatHistory(prev => [...prev, { role: 'assistant', content: errReply }]);
      addNotification('Connection Drop', 'AI Assistant connection interrupted.', 'error');
      return errReply;
    } finally {
      setIsAIPending(false);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([{
      role: 'assistant',
      content: 'Lumina AI logs cleared. Ask me anything to assist you!'
    }]);
  };

  return (
    <OSContext.Provider value={{
      fileSystem,
      windows,
      activeWindowId,
      settings,
      notifications,
      notificationHistory,
      chatHistory,
      isAIPending,
      currentExplorerPath,
      isStartMenuOpen,
      isQuickSettingsOpen,
      isSearchOpen,
      searchQuery,
      createFile,
      createDirectory,
      deleteItem,
      renameItem,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      focusWindow,
      updateWindowPosition,
      updateWindowSize,
      setTheme,
      setAccentColor,
      setWallpaper,
      updateSettings,
      addNotification,
      dismissNotification,
      clearNotificationHistory,
      sendAICommand,
      clearChatHistory,
      setCurrentExplorerPath,
      setIsStartMenuOpen,
      setIsQuickSettingsOpen,
      setIsSearchOpen,
      setSearchQuery,
      currentUser,
      isFirebaseActive,
      loginWithGoogle,
      logout
    }}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (context === undefined) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
