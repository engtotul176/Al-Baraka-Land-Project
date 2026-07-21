/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, Payment, BankDeposit, SystemSettings } from './types';
import { 
  getInitialMembers, 
  getInitialPayments, 
  getInitialBankDeposits, 
  DEFAULT_SETTINGS,
  DEFAULT_LOGO_SVG 
} from './initialData';
import { exportToExcel, toBanglaDigits, formatCurrencyBangla } from './utils';
import { isFirebaseConfigured, downloadAllFromFirebase, syncSingleItem, uploadAllToFirebase, deleteSingleItem } from './firebase';

// Sub Components Imports
import DashboardSheet from './components/DashboardSheet';
import MembersSheet from './components/MembersSheet';
import PaymentEntrySheet from './components/PaymentEntrySheet';
import ReceiptSheet from './components/ReceiptSheet';
import BankDepositSheet from './components/BankDepositSheet';
import MemberLedgerSheet from './components/MemberLedgerSheet';
import ReportsSheet from './components/ReportsSheet';
import GoogleAppsScriptSheet from './components/GoogleAppsScriptSheet';
import ManualSheet from './components/ManualSheet';
import SettingsSheet from './components/SettingsSheet';
import NoticeAndCommitteeSheet from './components/NoticeAndCommitteeSheet';

// Lucide Icons
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Printer, 
  Landmark, 
  FileText, 
  FileChartLine, 
  FileCode, 
  FileQuestion, 
  Settings, 
  Download, 
  Info,
  Calendar,
  Megaphone
} from 'lucide-react';

export default function App() {
  // Shared States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  // Secure Session States
  const [loggedInUser, setLoggedInUser] = useState<{ role: 'admin' | 'member'; memberId?: string; name?: string } | null>(null);
  const [loginRole, setLoginRole] = useState<'member' | 'admin'>('member');
  const [loginMemberId, setLoginMemberId] = useState('');
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Focus-navigation states
  const [selectedReceiptNo, setSelectedReceiptNo] = useState('');
  const [selectedLedgerMemberId, setSelectedLedgerMemberId] = useState('');

  // Cloud Sync Status states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Cloud Sync Function
  const syncFromCloud = async (currentSettings: SystemSettings = settings) => {
    if (!isFirebaseConfigured(currentSettings) || !currentSettings.firebaseSyncEnabled) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await downloadAllFromFirebase(currentSettings);
      if (data) {
        if (data.settings) {
          // If the cloud settings document is present, this means the Firebase database has been initialized
          // and synchronized. We can safely overwrite the local state with the cloud state even if it is completely empty (0 items).
          saveMembers(data.members);
          savePayments(data.payments);
          saveDeposits(data.bankDeposits);

          // Merge credentials from local setting to avoid overwriting API keys on sync
          const mergedSettings: SystemSettings = {
            ...data.settings,
            firebaseApiKey: currentSettings.firebaseApiKey || data.settings.firebaseApiKey,
            firebaseAuthDomain: currentSettings.firebaseAuthDomain || data.settings.firebaseAuthDomain,
            firebaseProjectId: currentSettings.firebaseProjectId || data.settings.firebaseProjectId,
            firebaseStorageBucket: currentSettings.firebaseStorageBucket || data.settings.firebaseStorageBucket,
            firebaseMessagingSenderId: currentSettings.firebaseMessagingSenderId || data.settings.firebaseMessagingSenderId,
            firebaseAppId: currentSettings.firebaseAppId || data.settings.firebaseAppId,
            firebaseSyncEnabled: currentSettings.firebaseSyncEnabled,
          };
          saveSettings(mergedSettings);
        } else {
          // Fallback for older databases or uninitialized setups where settings document is missing
          if (data.members.length > 0 || data.payments.length > 0 || data.bankDeposits.length > 0) {
            saveMembers(data.members);
            savePayments(data.payments);
            saveDeposits(data.bankDeposits);
          }
        }
      }
    } catch (err: any) {
      console.error("Cloud auto-sync failed:", err);
      setSyncError("ক্লাউড থেকে ডাটা লোড করতে ব্যর্থ হয়েছে। আপনার ইন্টারনেট কানেকশন বা ফায়ারবেস কনফিগ চেক করুন।");
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Initialize data on Mount
  useEffect(() => {
    let activeSettings: SystemSettings = DEFAULT_SETTINGS;
    try {
      // Check if we have an incoming Firebase configuration link in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const fbConfigParam = urlParams.get('fb_config');
      if (fbConfigParam) {
        try {
          const decodedConfig = JSON.parse(atob(fbConfigParam));
          if (decodedConfig && decodedConfig.firebaseApiKey) {
            const currentStored = localStorage.getItem('ab_settings');
            let baseSettings = currentStored ? JSON.parse(currentStored) : { ...DEFAULT_SETTINGS };
            const importedSettings = {
              ...baseSettings,
              firebaseApiKey: decodedConfig.firebaseApiKey || "",
              firebaseAuthDomain: decodedConfig.firebaseAuthDomain || "",
              firebaseProjectId: decodedConfig.firebaseProjectId || "",
              firebaseStorageBucket: decodedConfig.firebaseStorageBucket || "",
              firebaseMessagingSenderId: decodedConfig.firebaseMessagingSenderId || "",
              firebaseAppId: decodedConfig.firebaseAppId || "",
              firebaseSyncEnabled: true, // Auto-enable sync
            };
            localStorage.setItem('ab_settings', JSON.stringify(importedSettings));
            
            // Shared config defaults to Read-Only mode for security
            localStorage.setItem('ab_is_admin', 'false');
            setIsAdmin(false);

            // Clean URL query params without refreshing page
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            
            alert("🎉 অভিনন্দন! ফায়ারবেস ক্লাউড কানেকশন সফলভাবে ইম্পোর্ট হয়েছে। নিরাপত্তাজনিত কারণে অন্য মোবাইলের জন্য এটি 'মেম্বার ভিউ (রিড-অনলি)' হিসেবে যুক্ত হয়েছে। পরিবর্তন করতে এডমিন পিন ব্যবহার করুন!");
          }
        } catch (e) {
          console.error("Error importing fb_config from URL:", e);
        }
      }

      const storedMembers = localStorage.getItem('ab_members');
      const storedPayments = localStorage.getItem('ab_payments');
      const storedDeposits = localStorage.getItem('ab_deposits');
      const storedSettings = localStorage.getItem('ab_settings');

      if (storedMembers) {
        setMembers(JSON.parse(storedMembers));
      } else {
        const initM = getInitialMembers();
        setMembers(initM);
        localStorage.setItem('ab_members', JSON.stringify(initM));
      }

      if (storedPayments) {
        setPayments(JSON.parse(storedPayments));
      } else {
        const initP = getInitialPayments();
        setPayments(initP);
        localStorage.setItem('ab_payments', JSON.stringify(initP));
      }

      if (storedDeposits) {
        setBankDeposits(JSON.parse(storedDeposits));
      } else {
        const initD = getInitialBankDeposits();
        setBankDeposits(initD);
        localStorage.setItem('ab_deposits', JSON.stringify(initD));
      }

      // Read settings and merge environment variables for automatic connection
      let baseSettings = storedSettings ? JSON.parse(storedSettings) : { ...DEFAULT_SETTINGS };
      const envApiKey = ((import.meta as any).env?.VITE_FIREBASE_API_KEY as string) || "";
      if (envApiKey) {
        baseSettings = {
          ...baseSettings,
          firebaseApiKey: envApiKey,
          firebaseProjectId: ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID as string) || baseSettings.firebaseProjectId || "",
          firebaseAppId: ((import.meta as any).env?.VITE_FIREBASE_APP_ID as string) || baseSettings.firebaseAppId || "",
          firebaseAuthDomain: ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN as string) || baseSettings.firebaseAuthDomain || "",
          firebaseStorageBucket: ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET as string) || baseSettings.firebaseStorageBucket || "",
          firebaseMessagingSenderId: ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || baseSettings.firebaseMessagingSenderId || "",
          firebaseSyncEnabled: true // Auto-enable sync with env variables
        };
      } else {
        // Automatically wipe stale, old Firebase config to allow fresh configuration
        if (baseSettings.firebaseProjectId === "al-baraka-smart") {
          baseSettings = {
            ...baseSettings,
            firebaseApiKey: "",
            firebaseAuthDomain: "",
            firebaseProjectId: "",
            firebaseStorageBucket: "",
            firebaseMessagingSenderId: "",
            firebaseAppId: "",
            firebaseSyncEnabled: false,
          };
        } else if (!baseSettings.firebaseApiKey && DEFAULT_SETTINGS.firebaseApiKey) {
          baseSettings = {
            ...baseSettings,
            firebaseApiKey: DEFAULT_SETTINGS.firebaseApiKey,
            firebaseAuthDomain: DEFAULT_SETTINGS.firebaseAuthDomain,
            firebaseProjectId: DEFAULT_SETTINGS.firebaseProjectId,
            firebaseStorageBucket: DEFAULT_SETTINGS.firebaseStorageBucket,
            firebaseMessagingSenderId: DEFAULT_SETTINGS.firebaseMessagingSenderId,
            firebaseAppId: DEFAULT_SETTINGS.firebaseAppId,
            firebaseSyncEnabled: DEFAULT_SETTINGS.firebaseSyncEnabled,
          };
        }
      }
      
      // Auto-upgrade stale/default logo in local state to the gorgeous new custom circular Bengali logo
      if (baseSettings && (!baseSettings.logo || baseSettings.logo.includes('al-baraka-smart') || baseSettings.logo.includes('Courier New') || !baseSettings.logo.includes('Circular Green Background'))) {
        baseSettings.logo = DEFAULT_LOGO_SVG;
      }

      activeSettings = baseSettings;
      setSettings(activeSettings);
      localStorage.setItem('ab_settings', JSON.stringify(activeSettings));

      // Process logged in user state
      const storedUser = localStorage.getItem('ab_logged_in_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setLoggedInUser(parsedUser);
          if (parsedUser.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            if (parsedUser.memberId) {
              setSelectedLedgerMemberId(parsedUser.memberId);
            }
          }
        } catch (e) {
          setLoggedInUser(null);
        }
      } else {
        setLoggedInUser(null);
      }

      const storedIsAdmin = localStorage.getItem('ab_is_admin');
      if (storedIsAdmin === 'false') {
        setIsAdmin(false);
      } else if (storedIsAdmin === 'true') {
        setIsAdmin(true);
      } else {
        // Fallback
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }

    // Auto-sync from cloud if configured and enabled
    if (activeSettings && isFirebaseConfigured(activeSettings) && activeSettings.firebaseSyncEnabled) {
      syncFromCloud(activeSettings);
    }
  }, []);

  // 2. Persist state changes
  const saveMembers = (updated: Member[]) => {
    setMembers(updated);
    localStorage.setItem('ab_members', JSON.stringify(updated));
  };

  const savePayments = (updated: Payment[]) => {
    setPayments(updated);
    localStorage.setItem('ab_payments', JSON.stringify(updated));
  };

  const saveDeposits = (updated: BankDeposit[]) => {
    setBankDeposits(updated);
    localStorage.setItem('ab_deposits', JSON.stringify(updated));
  };

  const saveSettings = (updated: SystemSettings) => {
    setSettings(updated);
    localStorage.setItem('ab_settings', JSON.stringify(updated));
  };

  // 3. State update functions passed to sheets
  const handleAddMember = (m: Member) => {
    const updated = [m, ...members];
    saveMembers(updated);
    if (settings.firebaseSyncEnabled) {
      syncSingleItem(settings, 'members', m.memberId, m);
    }
  };

  const handleUpdateMember = (m: Member) => {
    const updated = members.map(old => old.memberId === m.memberId ? m : old);
    saveMembers(updated);
    if (settings.firebaseSyncEnabled) {
      syncSingleItem(settings, 'members', m.memberId, m);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    const updatedMembers = members.filter(m => m.memberId !== memberId);
    saveMembers(updatedMembers);
    
    const updatedPayments = payments.filter(p => p.memberId !== memberId);
    savePayments(updatedPayments);

    if (settings.firebaseSyncEnabled) {
      deleteSingleItem(settings, 'members', memberId);
      const deletedPayments = payments.filter(p => p.memberId === memberId);
      deletedPayments.forEach(p => {
        deleteSingleItem(settings, 'payments', p.receiptNo).catch(() => {});
      });
    }
  };

  const handleAddPayment = (p: Payment) => {
    const updated = [p, ...payments];
    savePayments(updated);
    if (settings.firebaseSyncEnabled) {
      syncSingleItem(settings, 'payments', p.receiptNo, p);
    }
  };

  const handleDeletePayment = (receiptNo: string) => {
    const updated = payments.filter(p => p.receiptNo !== receiptNo);
    savePayments(updated);
    if (settings.firebaseSyncEnabled) {
      deleteSingleItem(settings, 'payments', receiptNo);
    }
    alert("পেমেন্ট রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে!");
  };

  const handleUpdatePayment = (updatedPayment: Payment) => {
    const updated = payments.map(p => p.receiptNo === updatedPayment.receiptNo ? updatedPayment : p);
    savePayments(updated);
    if (settings.firebaseSyncEnabled) {
      syncSingleItem(settings, 'payments', updatedPayment.receiptNo, updatedPayment);
    }
  };

  const handleAddBankDeposit = (b: BankDeposit) => {
    const updated = [b, ...bankDeposits];
    saveDeposits(updated);
    if (settings.firebaseSyncEnabled) {
      syncSingleItem(settings, 'bankDeposits', b.id, b);
    }
  };

  const handleUpdateBankDeposit = (b: BankDeposit) => {
    const updated = bankDeposits.map(old => old.id === b.id ? b : old);
    saveDeposits(updated);
    if (settings.firebaseSyncEnabled) {
      syncSingleItem(settings, 'bankDeposits', b.id, b);
    }
  };

  const handleDeleteBankDeposit = (id: string) => {
    const updated = bankDeposits.filter(b => b.id !== id);
    saveDeposits(updated);
    if (settings.firebaseSyncEnabled) {
      deleteSingleItem(settings, 'bankDeposits', id);
    }
  };

  const handleUpdateSettings = (s: SystemSettings) => {
    const wasSyncEnabled = settings.firebaseSyncEnabled;
    saveSettings(s);
    if (s.firebaseSyncEnabled) {
      syncSingleItem(s, 'settings', 'system_config', s);
      if (!wasSyncEnabled) {
        // Automatically sync from cloud when sync is newly enabled
        syncFromCloud(s);
      }
    }
  };

  const handleToggleAdminMode = () => {
    if (isAdmin) {
      const confirmLock = window.confirm("আপনি কি এডমিন মোড বন্ধ করে সদস্য ভিউ (রিড-অনলি) মোডে যেতে চান?");
      if (confirmLock) {
        setIsAdmin(false);
        localStorage.setItem('ab_is_admin', 'false');
        localStorage.removeItem('ab_logged_in_user');
        setLoggedInUser(null);
        alert("🔒 এডমিন মোড বন্ধ করা হয়েছে। সেশন সুরক্ষিত রাখতে আপনাকে লগআউট করা হয়েছে।");
      }
    } else {
      const enteredPin = window.prompt("এই ডিভাইসে ডাটা এন্ট্রি করতে এডমিন পিন নম্বরটি (Admin PIN) লিখুন:");
      if (enteredPin === null) return;
      
      const expectedPin = settings.adminPin || "1234";
      if (enteredPin === expectedPin) {
        const user = { role: 'admin' as const };
        setLoggedInUser(user);
        setIsAdmin(true);
        localStorage.setItem('ab_is_admin', 'true');
        localStorage.setItem('ab_logged_in_user', JSON.stringify(user));
        alert("🔓 অভিনন্দন! এডমিন মোড সফলভাবে আনলক করা হয়েছে। এখন আপনি সকল ডাটা এন্ট্রি ও এডিট করতে পারবেন।");
      } else {
        alert("❌ ভুল পিন নম্বর! অনুগ্রহ করে সঠিক পিন নম্বর দিয়ে পুনরায় চেষ্টা করুন।");
      }
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      try {
        if (loginRole === 'admin') {
          const expectedPin = settings.adminPin || "1234";
          if (loginPin.trim() === expectedPin) {
            const user = { role: 'admin' as const };
            setLoggedInUser(user);
            setIsAdmin(true);
            localStorage.setItem('ab_logged_in_user', JSON.stringify(user));
            localStorage.setItem('ab_is_admin', 'true');
            setLoginPin('');
            setActiveTab('dashboard');
          } else {
            setLoginError('ভুল এডমিন পিন নম্বর! অনুগ্রহ করে সঠিক পিন দিয়ে চেষ্টা করুন।');
          }
        } else {
          // Member Login Lookup
          if (!loginMemberId.trim()) {
            setLoginError('অনুগ্রহ করে সদস্য আইডি লিখুন।');
            setIsLoggingIn(false);
            return;
          }
          if (!loginMobile.trim()) {
            setLoginError('অনুগ্রহ করে মোবাইল নম্বর লিখুন।');
            setIsLoggingIn(false);
            return;
          }

          // Normalize member ID input (e.g. "AB-01" or "01")
          const cleanIdInput = loginMemberId.trim().toUpperCase();
          let lookupId = cleanIdInput;
          if (!cleanIdInput.startsWith('AB-')) {
            const digitsOnly = cleanIdInput.replace(/[^0-9]/g, '');
            if (digitsOnly) {
              lookupId = `AB-${digitsOnly.padStart(2, '0')}`;
            }
          }

          const matchedMember = members.find(m => {
            const mId = m.memberId.trim().toUpperCase();
            return mId === lookupId || mId === cleanIdInput;
          });

          if (!matchedMember) {
            setLoginError(`সদস্য আইডি "${lookupId}" খুঁজে পাওয়া যায়নি! অনুগ্রহ করে সঠিক আইডিটি লিখুন (যেমন: AB-01)।`);
            setIsLoggingIn(false);
            return;
          }

          // Clean up phone number format for comparison
          const cleanPhone = (p: string) => p.replace(/[^0-9]/g, '').slice(-11); // match last 11 digits
          const cleanInputMobile = cleanPhone(loginMobile);
          const cleanMemberMobile = cleanPhone(matchedMember.mobile);

          if (cleanInputMobile === cleanMemberMobile || matchedMember.mobile.includes(loginMobile.trim())) {
            const user = { role: 'member' as const, memberId: matchedMember.memberId, name: matchedMember.name };
            setLoggedInUser(user);
            setIsAdmin(false);
            localStorage.setItem('ab_logged_in_user', JSON.stringify(user));
            localStorage.setItem('ab_is_admin', 'false');
            setSelectedLedgerMemberId(matchedMember.memberId);
            setLoginMemberId('');
            setLoginMobile('');
            setActiveTab('ledger'); // Send members directly to their own ledger
          } else {
            setLoginError('মোবাইল নম্বরটি মিলেনি! অনুগ্রহ করে সদস্য আইডির সাথে নিবন্ধিত সঠিক মোবাইল নম্বরটি লিখুন।');
          }
        }
      } catch (err) {
        console.error("Login failed:", err);
        setLoginError('লগইন প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } finally {
        setIsLoggingIn(false);
      }
    }, 600);
  };

  const handleLogout = () => {
    const confirm = window.confirm("আপনি কি নিশ্চিতভাবে লগআউট করতে চান?");
    if (!confirm) return;
    localStorage.removeItem('ab_logged_in_user');
    setLoggedInUser(null);
    setIsAdmin(false);
    setActiveTab('dashboard');
  };

  // 4. Batch Import (for Restore from Backup)
  const handleImportData = (imported: {
    members: Member[];
    payments: Payment[];
    bankDeposits: BankDeposit[];
    settings?: SystemSettings;
  }) => {
    saveMembers(imported.members);
    savePayments(imported.payments);
    saveDeposits(imported.bankDeposits);
    const activeSettings = imported.settings || settings;
    if (imported.settings) {
      saveSettings(imported.settings);
    }

    if (activeSettings.firebaseSyncEnabled) {
      uploadAllToFirebase(activeSettings, imported.members, imported.payments, imported.bankDeposits)
        .then(() => console.log("Cloud backup synced successfully."))
        .catch(err => console.error("Cloud backup sync failed:", err));
    }
  };

  // 5. Database Reset Controls
  const handleRestoreDemoData = () => {
    const confirm = window.confirm("সতর্কতা: এটি করলে বর্তমান সব সদস্য ও পেমেন্ট ডাটা মুছে গিয়ে পুনরায় পূর্বনির্ধারিত ডেমো ডাটা (৩০ জন সদস্য এবং টেস্ট হিসাবসমূহ) লোড হবে। আপনি কি নিশ্চিতভাবে রিসেট করতে চান?");
    if (!confirm) return;
    
    const initM = getInitialMembers();
    const initP = getInitialPayments();
    const initD = getInitialBankDeposits();
    
    saveMembers(initM);
    savePayments(initP);
    saveDeposits(initD);
    saveSettings(DEFAULT_SETTINGS);
    
    setSelectedReceiptNo('');
    setSelectedLedgerMemberId('');
    
    if (DEFAULT_SETTINGS.firebaseSyncEnabled) {
      uploadAllToFirebase(DEFAULT_SETTINGS, initM, initP, initD)
        .then(() => console.log("Cloud demo data synced successfully."))
        .catch(err => console.error("Cloud demo data sync failed:", err));
    }
    
    alert("সফলভাবে ডেমো ডাটা রিস্টোর করা হয়েছে!");
  };

  const handleClearAllData = () => {
    const confirm = window.confirm("সতর্কতা: এটি করলে আপনার ডাটাবেজের সকল সদস্য, পেমেন্ট আদায় এবং ব্যাংক জমার রেকর্ড চিরতরে মুছে যাবে! এটি আর পুনরুদ্ধার করা সম্ভব হবে না। আপনি কি সম্পূর্ণ নতুনভাবে নিজের রিয়াল ডাটা এন্ট্রি শুরু করতে চান?");
    if (!confirm) return;
    
    saveMembers([]);
    savePayments([]);
    saveDeposits([]);
    
    setSelectedReceiptNo('');
    setSelectedLedgerMemberId('');
    
    if (settings.firebaseSyncEnabled) {
      uploadAllToFirebase(settings, [], [], [])
        .then(() => console.log("Cloud database cleared successfully."))
        .catch(err => console.error("Cloud database clear failed:", err));
    }
    
    alert("আপনার ডাটাবেজ সফলভাবে খালি করা হয়েছে! এখন আপনি নতুন সদস্য ও আদায় হিসাব এন্ট্রি শুরু করতে পারেন।");
  };

  const handleResetSettingsToDefault = () => {
    const confirm = window.confirm("আপনি কি নিশ্চিতভাবে সকল সেটিংস (ফি ও প্রতিষ্ঠানের তথ্য) ডিফল্ট মানে রিসেট করতে চান?");
    if (!confirm) return;
    
    saveSettings(DEFAULT_SETTINGS);
    alert("সেটিংস সফলভাবে ডিফল্ট মানে রিসেট করা হয়েছে!");
  };

  // Initialize receipt focus if empty and payments loaded
  useEffect(() => {
    if (!selectedReceiptNo && payments.length > 0) {
      setSelectedReceiptNo(payments[0].receiptNo);
    }
  }, [payments, selectedReceiptNo]);

  // Initialize ledger focus if empty and members loaded
  useEffect(() => {
    if (!selectedLedgerMemberId && members.length > 0) {
      setSelectedLedgerMemberId(members[0].memberId);
    }
  }, [members, selectedLedgerMemberId]);

  // Handle Export to real Excel sheet
  const handleExportExcelClick = () => {
    exportToExcel(members, payments, bankDeposits, settings);
  };

  // Tabs metadata
  const TABS_METADATA = [
    { id: 'dashboard', name: 'ড্যাশবোর্ড', icon: LayoutDashboard, color: 'border-b-emerald-800' },
    { id: 'committee', name: 'নোটিশ ও কমিটি', icon: Megaphone, color: 'border-b-orange-600' },
    { id: 'members', name: 'সদস্য ডাটাবেজ', icon: Users, color: 'border-b-sky-700' },
    { id: 'payment', name: 'আদায় এন্ট্রি', icon: Receipt, color: 'border-b-yellow-600' },
    { id: 'receipt', name: 'প্রাপ্তির রশিদ', icon: Printer, color: 'border-b-gold' },
    { id: 'bank', name: 'ব্যাংক ডিপোজিট', icon: Landmark, color: 'border-b-blue-700' },
    { id: 'ledger', name: 'সদস্য খতিয়ান', icon: FileText, color: 'border-b-purple-700' },
    { id: 'reports', name: 'আর্থিক রিপোর্ট', icon: FileChartLine, color: 'border-b-indigo-700' },
    { id: 'script', name: 'গুগল স্ক্রিপ্ট', icon: FileCode, color: 'border-b-teal-700' },
    { id: 'manual', name: 'ব্যবহারকারী গাইড', icon: FileQuestion, color: 'border-b-amber-700' },
    { id: 'settings', name: 'সেটিংস', icon: Settings, color: 'border-b-slate-700' }
  ];

  // 1. If not logged in, render the Gorgeous Islamic/Classic-Green Login Gateway
  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at top right, #022c22 0%, #030712 100%)' }}>
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />
        
        <div className="w-full max-w-md bg-emerald-950/20 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.08)] p-6 md:p-8 space-y-6 relative z-10">
          {/* Top Crescent Emblem or Ring */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto bg-emerald-900/40 rounded-full border border-amber-500/30 p-1.5 flex items-center justify-center shadow-lg">
              <img 
                src={settings.logo} 
                alt="Al-Baraka Logo" 
                className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight flex items-center justify-center gap-2">
                {settings.orgName} <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase">স্মার্ট খতিয়ান</span>
              </h2>
              <p className="text-xs text-amber-400 font-medium mt-1">{settings.orgSlogan}</p>
            </div>
          </div>

          {/* Login Mode Toggle Tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-emerald-950/60">
            <button
              onClick={() => { setLoginRole('member'); setLoginError(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginRole === 'member' 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              সদস্য লগইন
            </button>
            <button
              onClick={() => { setLoginRole('admin'); setLoginError(''); }}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginRole === 'admin' 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings size={14} />
              এডমিন লগইন
            </button>
          </div>

          {/* Error Message Box */}
          {loginError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 leading-relaxed flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <p className="flex-1 font-medium">{loginError}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginRole === 'member' ? (
              <>
                {/* Member ID Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">১. আপনার সদস্য আইডি (Member ID)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-400 text-xs font-bold pointer-events-none">AB-</span>
                    <input
                      type="text"
                      value={loginMemberId}
                      onChange={(e) => setLoginMemberId(e.target.value)}
                      placeholder="যেমন: 01, 15, বা AB-01"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/40 border border-emerald-950 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono tracking-wider placeholder:text-slate-500 placeholder:text-xs"
                      disabled={isLoggingIn}
                      required
                    />
                  </div>
                </div>

                {/* Registered Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">২. নিবন্ধিত মোবাইল নম্বর (Mobile Number)</label>
                  <input
                    type="tel"
                    value={loginMobile}
                    onChange={(e) => setLoginMobile(e.target.value)}
                    placeholder="যেমন: 01XXXXXXXXX"
                    className="w-full px-4 py-2.5 bg-slate-950/40 border border-emerald-950 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 font-mono tracking-wider placeholder:text-slate-500 placeholder:text-xs"
                    disabled={isLoggingIn}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                {/* Admin PIN Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">এডমিন পিন কোড (Admin PIN)</label>
                  <input
                    type="password"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="••••"
                    maxLength={10}
                    className="w-full px-4 py-2.5 bg-slate-950/40 border border-emerald-950 rounded-xl text-white text-sm text-center focus:outline-none focus:border-amber-500 font-mono tracking-widest placeholder:text-slate-500 placeholder:text-xs"
                    disabled={isLoggingIn}
                    required
                  />
                </div>
              </>
            )}

            {/* Login Action Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg hover:shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              {isLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  যাচাই করা হচ্ছে...
                </>
              ) : (
                <>
                  প্রবেশ করুন (Sign In)
                  <span className="text-sm font-light">➔</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Support Guidelines / Info */}
          <div className="border-t border-emerald-950/50 pt-4 text-center">
            <p className="text-[10px] text-slate-400 leading-normal">
              লগইন করতে কোনো সমস্যা হলে অথবা আপনার সদস্য আইডি হারিয়ে গেলে প্রতিষ্ঠানের অ্যাডমিন বা আদায়কারীর সাথে যোগাযোগ করুন।
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Workbook Application Screen
  return (
    <div id="workbook-root" className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      {/* Top Professional Header Bar (No Print) */}
      <header className="bg-primary text-white border-b-4 border-gold shadow-md no-print px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full border border-gold/40 p-0.5 flex items-center justify-center">
            <img 
              src={settings.logo} 
              alt="Al-Baraka Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold font-sans flex items-center gap-1.5 leading-none">
              {settings.orgName} <span className="text-[10px] bg-gold text-primary font-bold px-2 py-0.5 rounded-full font-sans">স্মার্ট খতিয়ান</span>
            </h1>
            <p className="text-[10px] text-gold-light mt-1 font-sans">{settings.orgSlogan}</p>
          </div>
        </div>

        {/* Global Toolbar Action buttons */}
        <div className="flex items-center gap-2">
          {loggedInUser && (
            <div className="flex items-center gap-2 mr-1">
              <span className="text-xs bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 font-bold max-w-[150px] truncate">
                👤 {loggedInUser.role === 'admin' ? 'অ্যাডমিন' : loggedInUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer border-0 shadow-sm"
                title="সেশন শেষ করে লগআউট করুন"
              >
                লগআউট (Log Out)
              </button>
            </div>
          )}

          {/* Admin Lock / Unlock Status Toggle (Only for Admins) */}
          {loggedInUser?.role === 'admin' && (
            <button
              onClick={handleToggleAdminMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border shadow-sm transition-all duration-200 ${
                isAdmin 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              }`}
              title={isAdmin ? "এডমিন মোড সচল (লক করতে ক্লিক করুন)" : "সদস্য ভিউ রিড-অনলি (আনলক করতে ক্লিক করুন)"}
            >
              {isAdmin ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  🔓 এডমিন মোড
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  🔒 মেম্বার ভিউ (রিড-অনলি)
                </>
              )}
            </button>
          )}

          {/* Main Excel Export button (Only for Admins) */}
          {loggedInUser?.role === 'admin' && (
            <button
              onClick={handleExportExcelClick}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 border border-emerald-600/50 shadow-sm transition-colors cursor-pointer"
              title="গুগল শিটস ও মাইক্রোসফট এক্সেল ফাইল জেনারেট করুন"
            >
              <Download size={13} className="text-gold" />
              Export to Excel (.xlsx)
            </button>
          )}
          
          <div className="text-[10px] text-gray-300 font-medium bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl hidden md:block">
            সদস্য: <strong className="text-gold font-bold">{toBanglaDigits(members.length)}</strong> | মোট আদায়: <strong className="text-gold font-bold font-mono">{formatCurrencyBangla(payments.reduce((sum, p) => sum + p.amount, 0))}</strong>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Workbook Sheet Tabs Selector (No Print) */}
        <nav className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 no-print pb-px">
          {(loggedInUser?.role === 'admin' 
            ? TABS_METADATA 
            : TABS_METADATA.filter(t => ['dashboard', 'ledger', 'receipt', 'reports', 'manual', 'committee'].includes(t.id))
          ).map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-b-2 border-transparent ${
                  isActive 
                    ? `bg-white text-primary shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)] border-b-primary font-extrabold ${tab.color}`
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <IconComp size={14} className={isActive ? 'text-gold' : 'text-slate-400'} />
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Active Sheet Content Container */}
        <div id="sheet-viewport" className="focus:outline-none min-h-[500px]">
          {activeTab === 'dashboard' && (
            <DashboardSheet
              members={members}
              payments={payments}
              bankDeposits={bankDeposits}
              onSelectTab={setActiveTab}
              onSelectReceipt={setSelectedReceiptNo}
            />
          )}

          {activeTab === 'committee' && (
            <NoticeAndCommitteeSheet
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'members' && (
            <MembersSheet
              members={members}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onSelectTab={setActiveTab}
              onSelectMemberLedger={setSelectedLedgerMemberId}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentEntrySheet
              members={members}
              payments={payments}
              settings={settings}
              onAddPayment={handleAddPayment}
              onSelectTab={setActiveTab}
              onSelectReceipt={setSelectedReceiptNo}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'receipt' && (
            <ReceiptSheet
              payments={payments}
              members={members}
              settings={settings}
              selectedReceiptNo={selectedReceiptNo}
              onSelectReceipt={setSelectedReceiptNo}
            />
          )}

          {activeTab === 'bank' && (
            <BankDepositSheet
              bankDeposits={bankDeposits}
              payments={payments}
              onAddBankDeposit={handleAddBankDeposit}
              onUpdateBankDeposit={handleUpdateBankDeposit}
              onDeleteBankDeposit={handleDeleteBankDeposit}
              isAdmin={isAdmin}
            />
          )}

          {activeTab === 'ledger' && (
            <MemberLedgerSheet
              members={members}
              payments={payments}
              settings={settings}
              selectedMemberId={selectedLedgerMemberId}
              onSelectMemberId={setSelectedLedgerMemberId}
              onSelectTab={setActiveTab}
              onSelectReceipt={setSelectedReceiptNo}
              isLockedToMember={loggedInUser?.role === 'member'}
              isAdmin={isAdmin}
              onDeletePayment={handleDeletePayment}
              onUpdatePayment={handleUpdatePayment}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsSheet
              members={members}
              payments={payments}
              settings={settings}
              onSelectTab={setActiveTab}
              onSelectReceipt={setSelectedReceiptNo}
              onSelectMemberLedger={setSelectedLedgerMemberId}
              isAdmin={isAdmin}
              onDeletePayment={handleDeletePayment}
              onUpdatePayment={handleUpdatePayment}
            />
          )}

          {activeTab === 'script' && (
            <GoogleAppsScriptSheet
              settings={settings}
            />
          )}

          {activeTab === 'manual' && (
            <ManualSheet />
          )}

          {activeTab === 'settings' && (
            <SettingsSheet
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              members={members}
              payments={payments}
              bankDeposits={bankDeposits}
              onImportData={handleImportData}
              onRestoreDemoData={handleRestoreDemoData}
              onClearAllData={handleClearAllData}
              onResetSettingsToDefault={handleResetSettingsToDefault}
              isSyncing={isSyncing}
              syncError={syncError}
              onSyncFromCloud={() => syncFromCloud(settings)}
              isAdmin={isAdmin}
              onToggleAdmin={handleToggleAdminMode}
            />
          )}
        </div>
      </main>

      {/* Footer Branding Bar (No Print) */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-[10px] text-slate-400 font-sans tracking-wide no-print flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl w-full mx-auto">
        <p>© {toBanglaDigits("২০২৬")} {settings.orgName}. সর্বস্বত্ব সংরক্ষিত।</p>
        <p className="flex items-center gap-1 justify-center">
          <Info size={12} className="text-gold" />
          রিয়েল-টাইম ডাটা ইন্টিগ্রেশন এবং লোকাল স্টোরেজ দ্বারা পরিচালিত।
        </p>
      </footer>
    </div>
  );
}
