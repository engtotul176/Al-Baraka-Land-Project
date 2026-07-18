/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { SystemSettings, Member, Payment, BankDeposit } from '../types';
import { toBanglaDigits } from '../utils';
import { isFirebaseConfigured, uploadAllToFirebase, testFirebaseConnection } from '../firebase';
import { 
  Settings, 
  Save, 
  Upload, 
  Download, 
  RefreshCw, 
  Image, 
  FileJson, 
  CheckCircle2, 
  Trash2, 
  Database, 
  Cloud, 
  AlertCircle, 
  HelpCircle, 
  Key, 
  Lock 
} from 'lucide-react';

interface SettingsSheetProps {
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  // Backup / Restore props
  members: Member[];
  payments: Payment[];
  bankDeposits: BankDeposit[];
  onImportData: (data: { members: Member[]; payments: Payment[]; bankDeposits: BankDeposit[]; settings?: SystemSettings }) => void;
  onRestoreDemoData: () => void;
  onClearAllData: () => void;
  onResetSettingsToDefault: () => void;
  // Firebase Sync props
  isSyncing: boolean;
  syncError: string | null;
  onSyncFromCloud: () => void;
  isAdmin?: boolean;
  onToggleAdmin?: () => void;
}

export default function SettingsSheet({
  settings,
  onUpdateSettings,
  members,
  payments,
  bankDeposits,
  onImportData,
  onRestoreDemoData,
  onClearAllData,
  onResetSettingsToDefault,
  isSyncing,
  syncError,
  onSyncFromCloud,
  isAdmin = true,
  onToggleAdmin
}: SettingsSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Firebase Manual Sync States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  
  // Connection Testing States
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [shareQrUrl, setShareQrUrl] = useState<string | null>(null);

  // Local state for Firebase Configuration to prevent automatic sync on every keystroke
  const [localApiKey, setLocalApiKey] = useState(settings.firebaseApiKey || '');
  const [localProjectId, setLocalProjectId] = useState(settings.firebaseProjectId || '');
  const [localAppId, setLocalAppId] = useState(settings.firebaseAppId || '');
  const [localAuthDomain, setLocalAuthDomain] = useState(settings.firebaseAuthDomain || '');

  // Keep local state in sync when settings prop updates from the outside (e.g. from cloud download)
  React.useEffect(() => {
    setLocalApiKey(settings.firebaseApiKey || '');
    setLocalProjectId(settings.firebaseProjectId || '');
    setLocalAppId(settings.firebaseAppId || '');
    setLocalAuthDomain(settings.firebaseAuthDomain || '');
  }, [settings.firebaseApiKey, settings.firebaseProjectId, settings.firebaseAppId, settings.firebaseAuthDomain]);

  const handleSaveFirebaseConfig = () => {
    onUpdateSettings({
      ...settings,
      firebaseApiKey: localApiKey.trim(),
      firebaseProjectId: localProjectId.trim(),
      firebaseAppId: localAppId.trim(),
      firebaseAuthDomain: localAuthDomain.trim(),
    });
    alert("ফায়ারবেস কনফিগারেশন সফলভাবে সংরক্ষণ (Save) করা হয়েছে!");
  };

  const handleTestConnection = async () => {
    const tempSettings = {
      ...settings,
      firebaseApiKey: localApiKey.trim(),
      firebaseProjectId: localProjectId.trim(),
      firebaseAppId: localAppId.trim(),
      firebaseAuthDomain: localAuthDomain.trim(),
    };

    if (!isFirebaseConfigured(tempSettings)) {
      alert("আগে ফায়ারবেস কনফিগারেশন কীসমূহ পূরণ করুন!");
      return;
    }
    setIsTestingConn(true);
    setConnStatus(null);
    try {
      const result = await testFirebaseConnection(tempSettings);
      setConnStatus(result);
    } catch (err: any) {
      setConnStatus({ success: false, message: err.message || "কানেকশন টেস্ট ব্যর্থ হয়েছে।" });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleManualUpload = async () => {
    if (!isFirebaseConfigured(settings)) {
      alert("আগে ফায়ারবেস কনফিগারেশন কীসমূহ প্রদান করে সংরক্ষণ করুন!");
      return;
    }
    const confirm = window.confirm("আপনি কি বর্তমান লোকাল ডাটাবেজের সকল সদস্য, পেমেন্ট এবং ব্যাংক জমা ক্লাউড ফায়ারবেসে আপলোড করতে চান? এটি ক্লাউডের আগের ডাটা ওভাররাইট করবে।");
    if (!confirm) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgressText("প্রস্তুত করা হচ্ছে...");
    try {
      await uploadAllToFirebase(settings, members, payments, bankDeposits, (step) => {
        setUploadProgressText(step);
      });
      setUploadSuccess(true);
      alert("সফলভাবে লোকাল ডাটাবেজের সকল তথ্য ফায়ারবেস ক্লাউড ফায়ারস্টোরে আপলোড করা হয়েছে!");
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "ক্লাউডে আপলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ এবং ফায়ারবেস সেটিংস চেক করুন।");
    } finally {
      setIsUploading(false);
      setUploadProgressText(null);
    }
  };

  const handleManualDownload = async () => {
    if (!isFirebaseConfigured(settings)) {
      alert("আগে ফায়ারবেস কনফিগারেশন কীসমূহ প্রদান করে সংরক্ষণ করুন!");
      return;
    }
    const confirm = window.confirm("সতর্কতা: ক্লাউড থেকে ডাটা নামালে আপনার বর্তমান ব্রাউজারের লোকাল ডাটা মুছে ক্লাউড ডাটা দিয়ে প্রতিস্থাপিত হবে। আপনি কি ক্লাউড ফায়ারবেস থেকে ডাটা ডাউনলোড করতে চান?");
    if (!confirm) return;
    
    onSyncFromCloud();
  };

  // Handle setting updates
  const handleChange = (key: keyof SystemSettings, val: any) => {
    onUpdateSettings({
      ...settings,
      [key]: val
    });
  };

  // Convert File to base64 string for storage
  const handleImageUpload = (key: 'logo' | 'founderPhoto' | 'signature', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) { // Limit to 1MB to avoid localStorage overflow
      alert("ভুল! ফাইলের সাইজ খুব বড় (সর্বোচ্চ ১ মেগাবাইট অনুমোদনযোগ্য)। অনুগ্রহ করে সাইজ কমিয়ে আপলোড করুন।");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleChange(key, base64);
      alert("ছবি সফলভাবে আপলোড এবং ডাটাবেজে যুক্ত করা হয়েছে!");
    };
    reader.readAsDataURL(file);
  };

  // Backup data to JSON file
  const handleBackup = () => {
    const dataToBackup = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      settings,
      members,
      payments,
      bankDeposits
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Al_Baraka_Database_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore data from JSON file
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.members || !parsed.payments || !parsed.bankDeposits) {
          alert("ভুল ব্যাকআপ ফাইল! এটি আল-বারাকা ম্যানেজমেন্ট সিস্টেমের বৈধ ব্যাকআপ ফাইল নয়।");
          return;
        }

        const confirmRestore = window.confirm("সতর্কতা: ব্যাকআপ ফাইলটি ইম্পোর্ট করলে আপনার বর্তমান সকল ডাটা মুছে যাবে এবং এই ব্যাকআপ ফাইলের ডাটা দিয়ে প্রতিস্থাপিত হবে। আপনি কি নিশ্চিতভাবে রিস্টোর করতে চান?");
        if (!confirmRestore) return;

        onImportData({
          members: parsed.members,
          payments: parsed.payments,
          bankDeposits: parsed.bankDeposits,
          settings: parsed.settings || settings
        });

        alert("ডাটাবেজ সফলভাবে রিস্টোর করা হয়েছে! সকল ডাটা নতুনভাবে লোড করা হয়েছে।");
      } catch (err) {
        alert("ভুল! ফাইলটি পড়তে ব্যর্থ হয়েছে। ফাইলটি সঠিক JSON ফরম্যাটে আছে কি না যাচাই করুন।");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Settings className="text-gold" />
            সিস্টেম সেটিংস ও ব্যাকআপ (System Settings & Backup)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            তহবিলের পরিমাণ, কোম্পানির ঠিকানা, লোগো, প্রতিষ্ঠাতার তথ্য ও ছবি পরিবর্তন এবং ব্যাকআপ রিস্টোর করুন।
          </p>
        </div>
        
        {/* Dynamic DB Status indicator */}
        <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${
          members.length > 0 && members[0]?.name.includes("তানভীন আহমেদ")
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : members.length === 0 
              ? 'bg-sky-50 text-sky-800 border-sky-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          ডাটাবেজ স্ট্যাটাস: {
            members.length > 0 && members[0]?.name.includes("তানভীন আহমেদ")
              ? 'ডেমো ডাটা সক্রিয় (সদস্য: ৩০ জন)'
              : members.length === 0
                ? 'ব্ল্যাঙ্ক ডাটাবেজ সক্রিয় (০ জন সদস্য)'
                : `রিয়েল ডাটা সক্রিয় (সদস্য: ${toBanglaDigits(members.length)} জন)`
          }
        </div>
      </div>

      {/* Demo notice for users who want to enter real data */}
      {members.length > 0 && members[0]?.name.includes("তানভীন আহমেদ") && (
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs text-amber-900 leading-relaxed">
          <p className="font-bold mb-1 flex items-center gap-1">💡 নিজস্ব রিয়েল ডাটা এন্ট্রি শুরু করার পরামর্শ:</p>
          <p>
            আপনি বর্তমানে ডেমো ও প্রাক-পরিশোধিত টেস্ট ডাটা দেখছেন। আপনার নিজের গ্রাহক বা সদস্যের আসল ডাটা ইনপুট দিতে চাইলে, ডানদিকের প্যানেলে থাকা <strong>"সকল ডাটা সম্পূর্ণরূপে মুছুন"</strong> বাটনটি ক্লিক করে ডাটাবেজ সম্পূর্ণ খালি করে নিন। কোনো যেকোনো সময় ডেমো ডাটা পুনরায় ফিরে পেতে <strong>"ডেমো ডাটা লোড করুন"</strong> বাটনে ক্লিক করতে পারবেন।
          </p>
        </div>
      )}

      {/* Admin Mode Quick Panel */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm ${
        isAdmin 
          ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-900' 
          : 'bg-amber-500/5 border-amber-500/15 text-amber-900'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${
            isAdmin ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-amber-100 border-amber-200 text-amber-600'
          }`}>
            {isAdmin ? <Lock size={18} className="animate-pulse" /> : <Lock size={18} />}
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1.5">
              {isAdmin ? '🔓 এডমিন মোড সচল (Admin Mode Active)' : '🔒 মেম্বার ভিউ (Member View - Read Only)'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {isAdmin 
                ? 'বর্তমানে আপনি এডমিন মোডে আছেন। আপনি সকল সেটিংস পরিবর্তন, মেম্বার এন্ট্রি, পেমেন্ট আদায় ও ডেটাবেজ রিসেট করতে পারবেন।' 
                : 'বর্তমানে আপনি রিড-অনলি মোডে আছেন। ডাটা এন্ট্রি করতে বা সেটিংসের কোনো পরিবর্তন করতে এডমিন পিন দিয়ে আনলক করুন।'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onToggleAdmin}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow-sm border ${
            isAdmin 
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
              : 'bg-primary text-white border-primary hover:bg-primary-light'
          }`}
        >
          {isAdmin ? 'এডমিন লক করুন (Exit Admin)' : 'এডমিন পিন দিয়ে আনলক করুন (Unlock Admin)'}
        </button>
      </div>

      {/* Primary Setup Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Inputs Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
          <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Save size={16} />
            পদ্ধতি ও আর্থিক সেটিংস (Financial Controls)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মাসিক সঞ্চয়ের পরিমাণ (টাকা)*</label>
              <input
                type="number"
                value={settings.monthlyAmount}
                onChange={(e) => handleChange('monthlyAmount', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!isAdmin}
              />
            </div>

            {/* Registration Fee */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ভর্তি/রেজিস্ট্রেশন ফি (টাকা)*</label>
              <input
                type="number"
                value={settings.registrationFee}
                onChange={(e) => handleChange('registrationFee', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!isAdmin}
              />
            </div>

            {/* Meeting Fee */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মাসিক/সাধারণ সভা ফি (টাকা)*</label>
              <input
                type="number"
                value={settings.meetingFee}
                onChange={(e) => handleChange('meetingFee', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!isAdmin}
              />
            </div>

            {/* Fine */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">বিলম্ব জরিমানা বা ফাইন (টাকা)*</label>
              <input
                type="number"
                value={settings.fine}
                onChange={(e) => handleChange('fine', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!isAdmin}
              />
            </div>

            {/* Admin PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Lock size={12} className="text-amber-500 shrink-0" />
                এডমিন পিন কোড (Admin PIN)*
              </label>
              <input
                type="text"
                maxLength={8}
                value={settings.adminPin || "1234"}
                onChange={(e) => handleChange('adminPin', e.target.value.trim())}
                placeholder="যেমন: 1234"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold text-amber-600 bg-amber-50/10 disabled:bg-slate-100 disabled:text-slate-400"
                disabled={!isAdmin}
                title={isAdmin ? "পিন কোড পরিবর্তন করতে পারবেন" : "পিন পরিবর্তন করতে অনুগ্রহ করে এডমিন মোড আনলক করুন"}
              />
            </div>
          </div>

          <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5 pt-2">
            <CheckCircle2 size={16} />
            প্রকল্প ও প্রতিষ্ঠানের সাধারণ তথ্য (Organization Details)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">প্রতিষ্ঠানের নাম*</label>
              <input
                type="text"
                value={settings.orgName}
                onChange={(e) => handleChange('orgName', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">স্লোগান / আদর্শ বাক্য*</label>
              <input
                type="text"
                value={settings.orgSlogan}
                onChange={(e) => handleChange('orgSlogan', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">অফিস মোবাইল নম্বর*</label>
              <input
                type="text"
                value={settings.orgMobile}
                onChange={(e) => handleChange('orgMobile', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">অফিস ইমেইল*</label>
              <input
                type="email"
                value={settings.orgEmail}
                onChange={(e) => handleChange('orgEmail', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">অফিস কার্যালয়ের ঠিকানা*</label>
              <input
                type="text"
                value={settings.orgAddress}
                onChange={(e) => handleChange('orgAddress', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5 pt-2">
            <Image size={16} />
            প্রতিষ্ঠাতা ও স্বপ্নদ্রষ্টার বিবরণী (Founder Information)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">প্রতিষ্ঠাতার নাম*</label>
              <input
                type="text"
                value={settings.founderName}
                onChange={(e) => handleChange('founderName', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">প্রতিষ্ঠাতার মোবাইল নম্বর*</label>
              <input
                type="text"
                value={settings.founderMobile}
                onChange={(e) => handleChange('founderMobile', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">পদবী/ডেজিগনেশন*</label>
              <input
                type="text"
                value={settings.founderDesignation}
                onChange={(e) => handleChange('founderDesignation', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400"
                disabled={!isAdmin}
              />
            </div>
          </div>
        </div>

        {/* Assets & Backup Restore Control Panel (Right) */}
        <div className="space-y-6">
          {/* Custom File Uploads box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Image size={16} className="text-gold" />
              ডিজিটাল ব্র্যান্ডিং ফাইল আপলোড
            </h3>

            {/* Asset 1: Org Logo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">১. প্রকল্পের লোগো (Logo Image)</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full overflow-hidden p-1 flex items-center justify-center">
                  <img src={settings.logo} alt="Org Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload('logo', e)}
                  disabled={!isAdmin}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
              </div>
            </div>

            {/* Asset 2: Founder Photo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">২. প্রতিষ্ঠাতা ও স্বপ্নদ্রষ্টার ছবি</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={settings.founderPhoto} alt="Founder" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload('founderPhoto', e)}
                  disabled={!isAdmin}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
              </div>
            </div>

            {/* Asset 3: Signature */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600">৩. আদায়কারীর ডিজিটাল স্বাক্ষর</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-8 bg-slate-50 border border-slate-200 rounded overflow-hidden p-1 flex items-center justify-center">
                  <img src={settings.signature} alt="Signature" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleImageUpload('signature', e)}
                  disabled={!isAdmin}
                  className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Firebase Cloud Sync Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Cloud size={16} className="text-gold animate-pulse" />
              ফায়ারবেস ক্লাউড সিঙ্ক (Firebase Cloud Sync)
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal">
              আপনার আল-বারাকা ম্যানেজমেন্ট সিস্টেমকে বিনামূল্যে ক্লাউড ফায়ারবেস ডাটাবেজের সাথে যুক্ত করে সম্পূর্ণ অনলাইন করুন। এর ফলে কোনো ডাটা হারানোর ভয় থাকবে না এবং একাধিক ডিভাইস থেকে একসাথে রিয়েল-টাইম ডাটা এন্ট্রি করতে পারবেন।
            </p>

            {/* Auto-Sync Toggle Checkbox - Always Visible */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={!!settings.firebaseSyncEnabled}
                  onChange={(e) => handleChange('firebaseSyncEnabled', e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary w-5 h-5 cursor-pointer mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    অটোমেটিক ক্লাউড সিঙ্ক সক্রিয় করুন (Auto-Sync)
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                    এটি পিসি এবং মোবাইল উভয় ডিভাইসেই চালু রাখুন। সক্রিয় থাকলে যেকোনো নতুন ডাটা এন্ট্রি বা ডিলিট করার সাথে সাথে তা অন্য ডিভাইসেও আপডেট হয়ে যাবে।
                  </p>
                </div>
              </label>
            </div>

            {/* Sync configuration expander toggle */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <button 
                type="button"
                onClick={() => setShowFirebaseConfig(!showFirebaseConfig)}
                className="w-full text-left text-xs font-bold text-slate-700 flex items-center justify-between hover:text-primary transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1">
                  <Settings size={13} className="text-slate-500 animate-spin-slow" />
                  ফায়ারবেস কনফিগার করুন
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {showFirebaseConfig ? 'বন্ধ করুন' : 'খুলুন'}
                </span>
              </button>

              {showFirebaseConfig && (
                <div className="mt-3 space-y-3 border-t border-slate-200/60 pt-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Firebase API Key*</label>
                    <input 
                      type="password"
                      value={localApiKey}
                      onChange={(e) => setLocalApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Project ID*</label>
                    <input 
                      type="text"
                      value={localProjectId}
                      onChange={(e) => setLocalProjectId(e.target.value)}
                      placeholder="al-baraka-smart-db"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">App ID*</label>
                    <input 
                      type="text"
                      value={localAppId}
                      onChange={(e) => setLocalAppId(e.target.value)}
                      placeholder="1:12345678:web:abcdef..."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Auth Domain (ঐচ্ছিক)</label>
                    <input 
                      type="text"
                      value={localAuthDomain}
                      onChange={(e) => setLocalAuthDomain(e.target.value)}
                      placeholder="project.firebaseapp.com"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  {/* Save Configuration Button */}
                  <button
                    type="button"
                    onClick={handleSaveFirebaseConfig}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer border-0"
                  >
                    <Save size={12} />
                    কনফিগারেশন সংরক্ষণ করুন (Save Config)
                  </button>

                  {/* Share Config Options (Only if configured) */}
                  {settings.firebaseApiKey && settings.firebaseProjectId && (
                    <div className="mt-3 border-t border-slate-200/80 pt-3 space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-700 block">অন্যান্য মোবাইলে সিঙ্ক করার উপায়:</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const configToShare = {
                              firebaseApiKey: settings.firebaseApiKey,
                              firebaseProjectId: settings.firebaseProjectId,
                              firebaseAppId: settings.firebaseAppId,
                              firebaseAuthDomain: settings.firebaseAuthDomain,
                            };
                            const base64Config = btoa(JSON.stringify(configToShare));
                            const shareUrl = `${window.location.origin}${window.location.pathname}?fb_config=${base64Config}`;
                            
                            navigator.clipboard.writeText(shareUrl)
                              .then(() => alert("🎉 লিংক কপি হয়েছে! এটি অন্য মোবাইলে মেসেঞ্জারে বা হোয়াটসঅ্যাপে পাঠিয়ে দিন। ওই লিংকে ক্লিক করলেই অন্য মোবাইলেও এই ক্লাউড কানেক্ট হয়ে যাবে!"))
                              .catch(() => alert("কপি করা যায়নি। লিংক: " + shareUrl));
                          }}
                          className="py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors border border-sky-200"
                        >
                          <Save size={11} className="text-sky-600" />
                          লিংক কপি করুন
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const configToShare = {
                              firebaseApiKey: settings.firebaseApiKey,
                              firebaseProjectId: settings.firebaseProjectId,
                              firebaseAppId: settings.firebaseAppId,
                              firebaseAuthDomain: settings.firebaseAuthDomain,
                            };
                            const base64Config = btoa(JSON.stringify(configToShare));
                            const shareUrl = `${window.location.origin}${window.location.pathname}?fb_config=${base64Config}`;
                            setShareQrUrl(shareQrUrl === shareUrl ? null : shareUrl);
                          }}
                          className="py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors border border-amber-200"
                        >
                          <Image size={11} className="text-amber-600" />
                          {shareQrUrl ? 'QR কোড লুকান' : 'QR কোড দেখান'}
                        </button>
                      </div>

                      {shareQrUrl && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2.5 animate-fadeIn">
                          <p className="text-[10px] text-slate-500 font-bold text-center leading-normal">
                            অন্য মোবাইল থেকে সরাসরি কানেক্ট করতে নিচের QR কোডটি স্ক্যান করে ব্রাউজারে ওপেন করুন:
                          </p>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareQrUrl)}`} 
                              alt="Sync Config QR Code" 
                              className="w-[150px] h-[150px] object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShareQrUrl(null)}
                            className="text-[9px] font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            QR কোড বন্ধ করুন
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Setup Instruction trigger */}
                  <button
                    type="button"
                    onClick={() => setShowSetupGuide(!showSetupGuide)}
                    className="w-full mt-1 text-center text-[10px] text-sky-700 hover:underline flex items-center justify-center gap-0.5 cursor-pointer font-bold"
                  >
                    <HelpCircle size={11} />
                    কীভাবে ফায়ারবেস কনফিগারেশন বের করবেন?
                  </button>

                  {showSetupGuide && (
                    <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-100 text-[10px] text-sky-900 leading-relaxed space-y-1">
                      <p className="font-bold border-b border-sky-100 pb-0.5">সহজ ৫টি আদেশ:</p>
                      <p>১. <strong><a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-sky-800">firebase.google.com</a></strong> এ গিয়ে আপনার জিমেইল দিয়ে লগইন করে <strong>Add Project</strong>-এ ক্লিক করুন।</p>
                      <p>২. প্রজেক্টের একটি নাম দিন (যেমন: <strong>Al Baraka Smart</strong>)।</p>
                      <p>৩. প্রজেক্ট তৈরির পর ড্যাশবোর্ডে <strong>Web (কোড বন্ধনী &lt;/&gt; আইকন)</strong>-এ ক্লিক করে অ্যাপ রেজিস্টার করুন।</p>
                      <p>৪. রেজিস্টার করার পর স্ক্রিনে আসা <strong>firebaseConfig</strong> থেকে <code>apiKey</code>, <code>projectId</code> এবং <code>appId</code>-এর মানগুলো কপি করে এখানে পেস্ট করুন।</p>
                      <p>৫. ফায়ারবেস কনসোলের বাম পাশের মেনু থেকে <strong>Firestore Database</strong>-এ গিয়ে <strong>Create Database</strong>-এ ক্লিক করুন। স্টার্ট ইন <strong>Test Mode</strong> সিলেক্ট করে ডাটাবেজ তৈরি করুন। ব্যস, কাজ শেষ!</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sync Actions buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Upload Button */}
              <button
                type="button"
                onClick={handleManualUpload}
                disabled={isUploading || isSyncing}
                className="py-2.5 bg-primary hover:bg-primary-dark disabled:bg-slate-200 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="বর্তমান লোকাল ডাটাবেজের সকল তথ্য ফায়ারবেস ফায়ারস্টোরে ব্যাকআপ করুন"
              >
                {isUploading ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Upload size={13} />
                )}
                ক্লাউডে আপলোড
              </button>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleManualDownload}
                disabled={isUploading || isSyncing}
                className="py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {isSyncing ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Download size={13} />
                )}
                ক্লাউড থেকে ডাউনলোড
              </button>
            </div>

            {/* Connection Test Button */}
            {isFirebaseConfigured(settings) && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConn || isUploading || isSyncing}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer border border-slate-200"
              >
                {isTestingConn ? (
                  <RefreshCw size={13} className="animate-spin text-primary" />
                ) : (
                  <Cloud size={13} className="text-primary animate-pulse" />
                )}
                কানেকশন টেস্ট করুন (Test Connection)
              </button>
            )}

            {/* Connection Test Status messages */}
            {connStatus && (
              <div className={`p-3 rounded-xl text-[10px] leading-relaxed border flex items-start gap-1.5 font-bold ${
                connStatus.success 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {connStatus.success ? (
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={13} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{connStatus.success ? 'সংযুক্ত সফল!' : 'কানেকশন ব্যর্থ!'}</p>
                  <p className="mt-0.5 font-medium">{connStatus.message}</p>
                </div>
              </div>
            )}

            {/* Sync status messages */}
            {settings.firebaseSyncEnabled && isFirebaseConfigured(settings) && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-xl text-[10px] flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                ক্লাউড সিঙ্ক সক্রিয় রয়েছে (অটোমেটিক ব্যাকআপ চালু)
              </div>
            )}

            {syncError && (
              <div className="bg-rose-50 text-rose-800 border border-rose-100 p-2.5 rounded-xl text-[10px] flex items-start gap-1">
                <AlertCircle size={12} className="text-rose-600 mt-0.5 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}

            {isUploading && uploadProgressText && (
              <div className="bg-blue-50 text-blue-800 border border-blue-100 p-2.5 rounded-xl text-[10px] flex items-center gap-1.5 font-bold animate-pulse">
                <RefreshCw size={12} className="animate-spin text-blue-600 shrink-0" />
                <span>{uploadProgressText}</span>
              </div>
            )}

            {uploadError && (
              <div className="bg-rose-50 text-rose-800 border border-rose-100 p-2.5 rounded-xl text-[10px] flex items-start gap-1">
                <AlertCircle size={12} className="text-rose-600 mt-0.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-xl text-[10px] flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={12} className="text-emerald-600" />
                লোকাল ডাটা সফলভাবে ক্লাউডে আপলোড হয়েছে!
              </div>
            )}
          </div>

          {/* Database Backup & Restore box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <FileJson size={16} className="text-gold" />
              ডাটাবেজ ব্যাকআপ ও পুনরুদ্ধার (JSON)
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal">
              আপনার এন্ট্রি করা সকল ডাটা (সদস্য, পেমেন্ট ও ব্যাংক জমার হিসাব) নিরাপদ রাখতে আপনার কম্পিউটারে ব্যাকআপ করে রাখুন। প্রয়োজনের সময় যেকোনো মুহূর্তে রিস্টোর করতে পারবেন।
            </p>

            <div className="space-y-3 pt-2">
              {/* Download Backup */}
              <button
                onClick={handleBackup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download size={14} />
                ব্যাকআপ ফাইল ডাউনলোড (.json)
              </button>

              {/* Upload & Restore */}
              <div className="relative">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isAdmin}
                  className="w-full py-2.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title={isAdmin ? "ব্যাকআপ ডাটা রিস্টোর করুন" : "ব্যাকআপ রিস্টোর করতে অনুগ্রহ করে এডমিন মোড আনলক করুন"}
                >
                  <RefreshCw size={14} />
                  ব্যাকআপ রিস্টোর করুন (Restore)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestore}
                  className="hidden"
                  disabled={!isAdmin}
                />
              </div>
            </div>
          </div>

          {/* Database Reset & Quick Controls Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Database size={16} className="text-gold" />
              سিস্টেম ডাটাবেজ কন্ট্রোল (Database Controls)
            </h3>

            <p className="text-[11px] text-slate-500 leading-normal">
              এই কন্ট্রোলগুলো সতর্কতার সাথে ব্যবহার করুন। আপনি ডেমো ডাটা সাফ করতে পারেন অথবা পরীক্ষার জন্য ডেমো ডাটা পুনরায় রিলোড করতে পারেন।
            </p>

            <div className="space-y-2.5 pt-2">
              {/* Clear All Data */}
              <button
                onClick={onClearAllData}
                disabled={!isAdmin}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title={isAdmin ? "সকল সদস্য এবং পেমেন্ট ডাটা চিরতরে মুছে ফেলুন" : "ডাটা মুছতে অনুগ্রহ করে এডমিন মোড আনলক করুন"}
              >
                <Trash2 size={14} />
                সকল ডাটা সম্পূর্ণরূপে মুছুন (Start Fresh)
              </button>

              {/* Restore Demo Data */}
              <button
                onClick={onRestoreDemoData}
                disabled={!isAdmin}
                className="w-full py-2.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title={isAdmin ? "পূর্বনির্ধারিত ৩০ জন ডেমো সদস্যের ডাটা রিলোড করুন" : "ডেমো ডাটা লোড করতে অনুগ্রহ করে এডমিন মোড আনলক করুন"}
              >
                <RefreshCw size={14} />
                ডিফল্ট ডেমো ডাটা লোড করুন (Demo Data)
              </button>

              {/* Reset settings */}
              <button
                onClick={onResetSettingsToDefault}
                disabled={!isAdmin}
                className="w-full py-2.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title={isAdmin ? "অফিস সেটিংস এবং ফি ডিফল্ট মানে রিসেট করুন" : "সেটিংস রিসেট করতে অনুগ্রহ করে এডমিন মোড আনলক করুন"}
              >
                <Settings size={14} />
                অ্যাপ সেটিংস রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
