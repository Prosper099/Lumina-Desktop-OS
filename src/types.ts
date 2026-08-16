export interface FSNode {
  name: string;
  type: 'file' | 'directory';
  path: string; // full path e.g. "/Documents/shopping.txt"
  parentPath: string; // path of the parent folder, e.g. "/Documents"
  content?: string; // file text, canvas data, etc.
  createdAt: string;
  updatedAt: string;
  size?: number;
}

export interface OSWindow {
  id: string;
  title: string;
  iconName: string; // references Lucide icon key
  appId: string; // e.g. 'explorer', 'notepad', 'paint', 'browser', 'calc', 'settings', 'terminal', 'copilot'
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  prevX?: number;
  prevY?: number;
  prevWidth?: number;
  prevHeight?: number;
  minWidth?: number;
  minHeight?: number;
  args?: any; // custom args for the app instance (e.g. open path or file name)
}

export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export type OSTheme = 'light' | 'dark' | 'glass';

export interface OSSettings {
  theme: OSTheme;
  accentColor: string; // hex or tailwind text/bg class
  wallpaper: string; // preset ID or custom URL
  systemSound: boolean;
  username: string;
  brightness?: number; // 0 to 100
  scale?: number; // 100, 110, 125, etc.
  nightLight?: boolean;
  nightLightStrength?: number; // 0 to 100
  aiPersona?: 'balanced' | 'professional' | 'creative' | 'minimalist';
  aiVoiceSpeed?: number; // 0.5 to 2.0
  powerPlan?: 'performance' | 'balanced' | 'saver';
  sleepTimer?: number; // minutes or 0 for never
  wifiOn?: boolean;
  vpnActive?: boolean;
  bluetoothOn?: boolean;
  dnsServer?: string;
  lockEnabled?: boolean;
  lockPassword?: string;
  windowsUpdated?: boolean;
  firewallActive?: boolean;
  volume?: number; // 0 to 100
  refreshRate?: 60 | 120;
}
