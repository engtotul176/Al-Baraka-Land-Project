/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Megaphone, Users, Landmark, Plus, Trash2, Edit2, Save, X, Upload, Calendar, Bell, Shield, Phone } from 'lucide-react';
import { toBanglaDigits } from '../utils';
import { initFirebase, isFirebaseConfigured } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'General' | 'Urgent' | 'Meeting';
  active: boolean;
}

interface CommitteeMember {
  id: string;
  name: string;
  designation: string;
  mobile: string;
  photo: string; // base64 or SVG
}

interface BankSignatory {
  id: string;
  name: string;
  designation: string;
  mobile: string;
  photo: string; // base64 or SVG
}

interface NoticeAndCommitteeSheetProps {
  isAdmin?: boolean;
}

// Predefined gradient-based avatar SVGs for default committee members to look extremely professional
const createAvatarSvg = (bgColor: string, text: string) => `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgColor}" />
      <stop offset="100%" stop-color="%230f172a" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(%23grad)" />
  <circle cx="50" cy="38" r="20" fill="%23ffffff" opacity="0.15" />
  <circle cx="50" cy="38" r="16" fill="none" stroke="%23ffffff" stroke-width="2" opacity="0.5" />
  <path d="M 22,82 C 22,64 32,54 50,54 C 68,54 78,64 78,82 Z" fill="%23ffffff" opacity="0.2" />
  <text x="50" y="90" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="%23d4af37" text-anchor="middle" letter-spacing="1">${text}</text>
  
  <!-- Subtle emblem inside -->
  <circle cx="50" cy="38" r="6" fill="%23d4af37" opacity="0.2" />
</svg>`;

const DEFAULT_NOTICES: Notice[] = [
  {
    id: 'notice-1',
    title: 'আল-বারাকা ভূমি প্রকল্পের সম্মানিত সাধারণ সদস্যদের কিস্তি পরিশোধ সংক্রান্ত নোটিশ',
    content: 'সকল সম্মানিত সদস্যদের অবগতির জন্য জানানো যাচ্ছে যে, ২০২৬ সালের জানুয়ারি ও ফেব্রুয়ারি মাসের মাসিক সঞ্চয় (২,০০০ টাকা হারে) এবং রেজিস্ট্রেশন ফি পরিশোধের জন্য অনুরোধ করা হলো। নির্দিষ্ট সময়ের মধ্যে পরিশোধ করে রশিদ বুঝে নিন।',
    date: '2026-01-10',
    category: 'Urgent',
    active: true
  },
  {
    id: 'notice-2',
    title: 'প্রকল্পের প্রথম বার্ষিক সাধারণ সভা (AGM) সংক্রান্ত বিজ্ঞপ্তি',
    content: 'আল-বারাকা ভূমি প্রকল্পের আসন্ন বার্ষিক সাধারণ সভা আগামী মাসের ১০ তারিখ রোজ শুক্রবার সকাল ১০:০০ ঘটিকায় আমাদের নিজস্ব কার্যালয়ে অনুষ্ঠিত হবে। সকল সদস্যকে যথাসময়ে উপস্থিত থেকে মূল্যবান মতামত দেওয়ার জন্য বিনীত অনুরোধ রইল।',
    date: '2026-02-15',
    category: 'Meeting',
    active: true
  },
  {
    id: 'notice-3',
    title: 'ব্যাংক হিসাব ও স্বচ্ছতার বিবরণী প্রকাশ',
    content: 'আমাদের প্রকল্পের সকল লেনদেন জনতা ব্যাংক পিএলসি, ময়মনসিংহ শাখার হিসাব নম্বর: ০১০০২৯৪২৭৮৫৫৩ এর মাধ্যমে পরিচালিত হচ্ছে। সকল ব্যাংক জমা স্লিপ ও হিসাব বিবরণী সরাসরি "আর্থিক রিপোর্ট" ট্যাব থেকে দেখতে পারবেন।',
    date: '2026-03-01',
    category: 'General',
    active: true
  }
];

const DEFAULT_COMMITTEE: CommitteeMember[] = [
  {
    id: 'c-1',
    name: 'প্রকৌশলী মোঃ তানভীন আহমেদ টুটুল',
    designation: 'সভাপতি (President)',
    mobile: '01672965561',
    photo: createAvatarSvg('%23047857', 'PRESIDENT')
  },
  {
    id: 'c-2',
    name: 'মোঃ রুমান',
    designation: 'সহ-সভাপতি (Vice President)',
    mobile: '01735449806',
    photo: createAvatarSvg('%230369a1', 'V-PRESIDENT')
  },
  {
    id: 'c-3',
    name: 'মোঃ মাহমুদুল হক (সোহেল)',
    designation: 'সাধারণ সম্পাদক (General Secretary)',
    mobile: '0172284662',
    photo: createAvatarSvg('%237c3aed', 'SECRETARY')
  },
  {
    id: 'c-4',
    name: 'প্রকৌশলী মোঃ মাহমুদুল হাসান (মাসুম)',
    designation: 'সাংগঠনিক সম্পাদক (Organizing Secretary)',
    mobile: '01710335567',
    photo: createAvatarSvg('%23db2777', 'ORG-SEC')
  },
  {
    id: 'c-5',
    name: 'রাকিবুল হাসান (শিপন)',
    designation: 'কোষাধ্যক্ষ (Treasurer)',
    mobile: '01911919786',
    photo: createAvatarSvg('%23ea580c', 'TREASURER')
  },
  {
    id: 'c-6',
    name: 'মোঃ আরমান হোসেন',
    designation: 'দপ্তর সম্পাদক (Office Secretary)',
    mobile: '01701633900',
    photo: createAvatarSvg('%230d9488', 'OFFICE-SEC')
  },
  {
    id: 'c-7',
    name: 'জাকির হোসেন তালুকদার',
    designation: 'প্রচার ও প্রকাশনা সম্পাদক (Publicity Secretary)',
    mobile: '01753477371',
    photo: createAvatarSvg('%234f46e5', 'PR-SEC')
  },
  {
    id: 'c-8',
    name: 'প্রকৌশলী খন্দকার মাহবুবুল ইসলাম (রুবেল)',
    designation: 'কার্যকারী সদস্য (Executive Member)',
    mobile: '01740062064',
    photo: createAvatarSvg('%23475569', 'MEMBER-1')
  },
  {
    id: 'c-9',
    name: 'প্রকৌশলী আব্দুল্লাহ আল-আমিন',
    designation: 'কার্যকারী সদস্য (Executive Member)',
    mobile: '01675889289',
    photo: createAvatarSvg('%23475569', 'MEMBER-2')
  }
];

const DEFAULT_SIGNATORIES: BankSignatory[] = [
  {
    id: 's-1',
    name: 'প্রকৌশলী মোঃ তানভীন আহমেদ',
    designation: 'সভাপতি ও ১ম স্বাক্ষরকারী (Account Signatory 1)',
    mobile: '01672965561',
    photo: createAvatarSvg('%23047857', 'SIGN-1')
  },
  {
    id: 's-2',
    name: 'মোঃ রুমান',
    designation: 'সহ-সভাপতি ও ২য় স্বাক্ষরকারী (Account Signatory 2)',
    mobile: '01735449806',
    photo: createAvatarSvg('%230369a1', 'SIGN-2')
  },
  {
    id: 's-3',
    name: 'মোঃ মাহমুদুল হক',
    designation: 'সাধারণ সম্পাদক ও ৩য় স্বাক্ষরকারী (Account Signatory 3)',
    mobile: '0172284662',
    photo: createAvatarSvg('%237c3aed', 'SIGN-3')
  }
];

export default function NoticeAndCommitteeSheet({ isAdmin = false }: NoticeAndCommitteeSheetProps) {
  // Local active tab within Notice Board and Committee Page
  const [subTab, setSubTab] = useState<'notice' | 'committee' | 'bank_sign'>('notice');

  // Persistence state hooks
  const [notices, setNotices] = useState<Notice[]>([]);
  const [committee, setCommittee] = useState<CommitteeMember[]>([]);
  const [signatories, setSignatories] = useState<BankSignatory[]>([]);

  // Add / Edit form states
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'General' | 'Urgent' | 'Meeting'>('General');
  const [showNoticeForm, setShowNoticeForm] = useState(false);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberFormName, setMemberFormName] = useState('');
  const [memberFormDesg, setMemberFormDesg] = useState('');
  const [memberFormMobile, setMemberFormMobile] = useState('');
  const [memberFormPhoto, setMemberFormPhoto] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const [editingSigId, setEditingSigId] = useState<string | null>(null);
  const [sigFormName, setSigFormName] = useState('');
  const [sigFormDesg, setSigFormDesg] = useState('');
  const [sigFormMobile, setSigFormMobile] = useState('');
  const [sigFormPhoto, setSigFormPhoto] = useState('');
  const [isAddingSig, setIsAddingSig] = useState(false);

  // Helper to get active SystemSettings from localStorage
  const getStoredSettings = () => {
    try {
      const stored = localStorage.getItem('ab_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  };

  // Helper to fetch notices & committee from Cloud Firebase
  const fetchFromCloud = async () => {
    const settings = getStoredSettings();
    if (!settings || !isFirebaseConfigured(settings)) return;
    const fb = initFirebase(settings);
    if (!fb) return;

    try {
      const docRef = doc(fb.db, 'settings', 'notices_and_committee');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.notices && Array.isArray(data.notices)) {
          setNotices(data.notices);
          localStorage.setItem('ab_custom_notices', JSON.stringify(data.notices));
        }
        if (data.committee && Array.isArray(data.committee)) {
          setCommittee(data.committee);
          localStorage.setItem('ab_custom_committee', JSON.stringify(data.committee));
        }
        if (data.signatories && Array.isArray(data.signatories)) {
          setSignatories(data.signatories);
          localStorage.setItem('ab_custom_signatories', JSON.stringify(data.signatories));
        }
      }
    } catch (err) {
      console.error("Error fetching notices and committee from cloud:", err);
    }
  };

  // Helper to upload notices & committee to Cloud Firebase
  const syncToCloud = async (newNotices?: Notice[], newCommittee?: CommitteeMember[], newSignatories?: BankSignatory[]) => {
    const settings = getStoredSettings();
    if (!settings || !isFirebaseConfigured(settings)) return;
    const fb = initFirebase(settings);
    if (!fb) return;

    try {
      const n = newNotices !== undefined ? newNotices : notices;
      const c = newCommittee !== undefined ? newCommittee : committee;
      const s = newSignatories !== undefined ? newSignatories : signatories;

      const docRef = doc(fb.db, 'settings', 'notices_and_committee');
      await setDoc(docRef, {
        notices: n,
        committee: c,
        signatories: s,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error syncing notices and committee to cloud:", err);
    }
  };

  // 1. Load initial states from LocalStorage and then Firebase
  useEffect(() => {
    const storedNotices = localStorage.getItem('ab_custom_notices');
    if (storedNotices) {
      setNotices(JSON.parse(storedNotices));
    } else {
      setNotices(DEFAULT_NOTICES);
      localStorage.setItem('ab_custom_notices', JSON.stringify(DEFAULT_NOTICES));
    }

    const storedCommittee = localStorage.getItem('ab_custom_committee');
    if (storedCommittee) {
      setCommittee(JSON.parse(storedCommittee));
    } else {
      setCommittee(DEFAULT_COMMITTEE);
      localStorage.setItem('ab_custom_committee', JSON.stringify(DEFAULT_COMMITTEE));
    }

    const storedSignatories = localStorage.getItem('ab_custom_signatories');
    if (storedSignatories) {
      setSignatories(JSON.parse(storedSignatories));
    } else {
      setSignatories(DEFAULT_SIGNATORIES);
      localStorage.setItem('ab_custom_signatories', JSON.stringify(DEFAULT_SIGNATORIES));
    }

    fetchFromCloud();
  }, []);

  // Save updates helper
  const saveNotices = (updated: Notice[]) => {
    setNotices(updated);
    localStorage.setItem('ab_custom_notices', JSON.stringify(updated));
    syncToCloud(updated, committee, signatories);
  };

  const saveCommittee = (updated: CommitteeMember[]) => {
    setCommittee(updated);
    localStorage.setItem('ab_custom_committee', JSON.stringify(updated));
    syncToCloud(notices, updated, signatories);
  };

  const saveSignatories = (updated: BankSignatory[]) => {
    setSignatories(updated);
    localStorage.setItem('ab_custom_signatories', JSON.stringify(updated));
    syncToCloud(notices, committee, updated);
  };

  // 2. Notice Board operations
  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert("শিরোনাম এবং বিস্তারিত বিবরণ দিন!");
      return;
    }

    if (editingNoticeId) {
      const updated = notices.map(n => 
        n.id === editingNoticeId 
          ? { ...n, title: noticeTitle, content: noticeContent, category: noticeCategory } 
          : n
      );
      saveNotices(updated);
      setEditingNoticeId(null);
      alert("নোটিশটি সফলভাবে আপডেট হয়েছে!");
    } else {
      const newNotice: Notice = {
        id: `notice-${Date.now()}`,
        title: noticeTitle,
        content: noticeContent,
        category: noticeCategory,
        date: new Date().toISOString().split('T')[0],
        active: true
      };
      saveNotices([newNotice, ...notices]);
      alert("নতুন নোটিশ সফলভাবে জারি করা হয়েছে!");
    }

    // Reset Form
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeCategory('General');
    setShowNoticeForm(false);
  };

  const startEditNotice = (n: Notice) => {
    setEditingNoticeId(n.id);
    setNoticeTitle(n.title);
    setNoticeContent(n.content);
    setNoticeCategory(n.category);
    setShowNoticeForm(true);
  };

  const handleDeleteNotice = (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি মুছে ফেলতে চান?")) {
      const updated = notices.filter(n => n.id !== id);
      saveNotices(updated);
    }
  };

  const toggleNoticeActive = (id: string) => {
    const updated = notices.map(n => n.id === id ? { ...n, active: !n.active } : n);
    saveNotices(updated);
  };

  // 3. Committee member operations
  const startEditMember = (m: CommitteeMember) => {
    setEditingMemberId(m.id);
    setMemberFormName(m.name);
    setMemberFormDesg(m.designation);
    setMemberFormMobile(m.mobile);
    setMemberFormPhoto(m.photo);
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberFormName.trim() || !memberFormDesg.trim()) {
      alert("সদস্যের নাম ও পদবী আবশ্যিক!");
      return;
    }

    if (isAddingMember) {
      const newMember: CommitteeMember = {
        id: `c-${Date.now()}`,
        name: memberFormName,
        designation: memberFormDesg,
        mobile: memberFormMobile,
        photo: memberFormPhoto || createAvatarSvg('%23475569', 'MEMBER')
      };
      saveCommittee([...committee, newMember]);
      setIsAddingMember(false);
      alert("নতুন কমিটি সদস্য সফলভাবে যোগ করা হয়েছে!");
    } else {
      const updated = committee.map(m => 
        m.id === editingMemberId 
          ? { ...m, name: memberFormName, designation: memberFormDesg, mobile: memberFormMobile, photo: memberFormPhoto } 
          : m
      );
      saveCommittee(updated);
      setEditingMemberId(null);
      alert("সদস্য তথ্য সফলভাবে এডিট হয়েছে!");
    }
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই কমিটি সদস্যকে তালিকা থেকে মুছে ফেলতে চান?")) {
      const updated = committee.filter(m => m.id !== id);
      saveCommittee(updated);
      alert("সদস্য তথ্য সফলভাবে মুছে ফেলা হয়েছে!");
    }
  };

  // 4. Bank Signatories operations
  const startEditSig = (s: BankSignatory) => {
    setEditingSigId(s.id);
    setSigFormName(s.name);
    setSigFormDesg(s.designation);
    setSigFormMobile(s.mobile);
    setSigFormPhoto(s.photo);
  };

  const handleSigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigFormName.trim() || !sigFormDesg.trim()) {
      alert("সদস্যের নাম ও পদবী আবশ্যিক!");
      return;
    }

    if (isAddingSig) {
      const newSig: BankSignatory = {
        id: `s-${Date.now()}`,
        name: sigFormName,
        designation: sigFormDesg,
        mobile: sigFormMobile,
        photo: sigFormPhoto || createAvatarSvg('%23475569', 'SIGN')
      };
      saveSignatories([...signatories, newSig]);
      setIsAddingSig(false);
      alert("নতুন ব্যাংক স্বাক্ষরকারী সদস্য সফলভাবে যোগ করা হয়েছে!");
    } else {
      const updated = signatories.map(s => 
        s.id === editingSigId 
          ? { ...s, name: sigFormName, designation: sigFormDesg, mobile: sigFormMobile, photo: sigFormPhoto } 
          : s
      );
      saveSignatories(updated);
      setEditingSigId(null);
      alert("ব্যাংক পরিচালনা সদস্যের তথ্য এডিট হয়েছে!");
    }
  };

  const handleDeleteSig = (id: string) => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে এই ব্যাংক স্বাক্ষরকারী সদস্যকে মুছে ফেলতে চান?")) {
      const updated = signatories.filter(s => s.id !== id);
      saveSignatories(updated);
      alert("স্বাক্ষরকারী সদস্য সফলভাবে মুছে ফেলা হয়েছে!");
    }
  };

  // File Upload base64 transformer
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'member' | 'sig') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("ফাইলের সাইজ অনেক বড়! অনুগ্রহ করে ১.৫ MB এর চেয়ে ছোট ছবি আপলোড করুন।");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (type === 'member') {
        setMemberFormPhoto(base64String);
      } else {
        setSigFormPhoto(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Megaphone className="text-gold" />
            নোটিশ বোর্ড ও পরিচালনা উইং (Notice & Organization)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            এখানে আপনার সংগঠনের সর্বশেষ সাধারণ নোটিশ, ৯ জন কার্যকারী কমিটির সদস্য এবং ব্যাংক স্বাক্ষরকারী পরিচালকদের বিবরণী দেখতে পারবেন।
          </p>
        </div>

        {/* Sub tabs switches */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubTab('notice')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'notice' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone size={14} />
            নোটিশ বোর্ড
          </button>
          <button
            onClick={() => setSubTab('committee')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'committee' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            কার্যকারী সদস্য (৯ জন)
          </button>
          <button
            onClick={() => setSubTab('bank_sign')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              subTab === 'bank_sign' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Landmark size={14} />
            ব্যাংক পরিচালনা সদস্য (৩ জন)
          </button>
        </div>
      </div>

      {/* Main Content Render area */}
      <div className="min-h-[400px]">
        {/* TAB 1: Notice Board */}
        {subTab === 'notice' && (
          <div className="space-y-5">
            {/* Admin Add Notice Button & Block */}
            {isAdmin && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                {!showNoticeForm ? (
                  <button
                    onClick={() => {
                      setEditingNoticeId(null);
                      setNoticeTitle('');
                      setNoticeContent('');
                      setNoticeCategory('General');
                      setShowNoticeForm(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border-0 shadow-sm transition-colors"
                  >
                    <Plus size={15} />
                    নতুন নোটিশ লিখুন
                  </button>
                ) : (
                  <form onSubmit={handleNoticeSubmit} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <h3 className="text-sm font-bold text-primary flex items-center gap-1">
                        <Bell size={16} className="text-gold" />
                        {editingNoticeId ? 'নোটিশ সম্পাদনা করুন' : 'নতুন নোটিশ জারি করুন'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowNoticeForm(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600">নোটিশের শিরোনাম*</label>
                        <input
                          type="text"
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          placeholder="আকর্ষণীয় ও সংক্ষিপ্ত শিরোনাম দিন"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-600">ক্যাটাগরি*</label>
                        <select
                          value={noticeCategory}
                          onChange={(e) => setNoticeCategory(e.target.value as any)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white"
                        >
                          <option value="General">সাধারণ বিজ্ঞপ্তি</option>
                          <option value="Urgent">জরুরি বিজ্ঞপ্তি ⚠️</option>
                          <option value="Meeting">সভার নোটিশ 📅</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-600">বিস্তারিত বিবরণ*</label>
                      <textarea
                        value={noticeContent}
                        onChange={(e) => setNoticeContent(e.target.value)}
                        placeholder="নোটিশের বিস্তারিত বিবরণ সুন্দর করে বাংলা ভাষায় লিখুন..."
                        rows={4}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary leading-relaxed"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNoticeForm(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border-0"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-light rounded-xl transition-all border-0 shadow-sm"
                      >
                        {editingNoticeId ? 'আপডেট করুন' : 'জারি করুন'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* List of active notices */}
            <div className="space-y-4">
              {notices.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400 font-medium">
                  বর্তমানে কোনো নোটিশ জারি করা নেই।
                </div>
              ) : (
                notices.map(notice => (
                  <div 
                    key={notice.id} 
                    className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 transition-all relative overflow-hidden ${
                      !notice.active ? 'opacity-65' : ''
                    } ${
                      notice.category === 'Urgent' ? 'border-l-4 border-l-rose-500' :
                      notice.category === 'Meeting' ? 'border-l-4 border-l-amber-500' :
                      'border-l-4 border-l-emerald-600'
                    }`}
                  >
                    {/* Badge Indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-2">
                        {notice.category === 'Urgent' && (
                          <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            ⚠️ জরুরি নোটিশ
                          </span>
                        )}
                        {notice.category === 'Meeting' && (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1">
                            📅 সভার বিজ্ঞপ্তি
                          </span>
                        )}
                        {notice.category === 'General' && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1">
                            📢 সাধারণ বিজ্ঞপ্তি
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar size={11} />
                          {toBanglaDigits(notice.date)}
                        </span>
                      </div>

                      {/* Admin actions inside Notice card */}
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleNoticeActive(notice.id)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border cursor-pointer ${
                              notice.active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            {notice.active ? 'সচল (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                          </button>
                          <button
                            onClick={() => startEditNotice(notice)}
                            className="p-1 text-sky-600 hover:bg-sky-50 rounded transition-colors cursor-pointer border-0"
                            title="সম্পাদনা"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteNotice(notice.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer border-0"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-primary leading-snug">{notice.title}</h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2.5 whitespace-pre-wrap">{notice.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Executive Committee (৯ জন) */}
        {subTab === 'committee' && (
          <div className="space-y-6">
            {/* Header description for Committee */}
            <div className="bg-emerald-950/5 p-4 rounded-xl border border-emerald-950/10 flex items-start gap-2.5 text-xs">
              <Shield className="text-emerald-700 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold text-slate-800">কার্যকারী সদস্য (Executive Committee Roster)</p>
                <p className="text-slate-500 mt-1">আমাদের প্রকল্পের নীতি নির্ধারণী ও পরিচালনার দায়িত্বে নিয়োজিত কার্যকারী ৯ জন সদস্যদের প্যানেল।</p>
              </div>
            </div>

            {/* Admin Add Committee Member Button & Block */}
            {isAdmin && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                {!isAddingMember ? (
                  <button
                    onClick={() => {
                      setIsAddingMember(true);
                      setMemberFormName('');
                      setMemberFormDesg('');
                      setMemberFormMobile('');
                      setMemberFormPhoto(createAvatarSvg('%23047857', 'MEMBER'));
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border-0 shadow-sm transition-colors"
                  >
                    <Plus size={15} />
                    নতুন কমিটি সদস্য যোগ করুন
                  </button>
                ) : (
                  <form onSubmit={handleMemberSubmit} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <h3 className="text-sm font-bold text-primary flex items-center gap-1">
                        <Users size={16} className="text-gold" />
                        নতুন কমিটি সদস্য যুক্ত করুন
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddingMember(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Photo input with preview */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-600/10 shadow-inner flex-shrink-0 bg-slate-50">
                        <img src={memberFormPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">ছবি আপলোড (১.৫ MB সর্বোচ্চ)</label>
                        <div className="relative inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'member')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200">
                            <Upload size={14} />
                            ছবি নির্বাচন করুন
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-600 text-xs">নাম (বাংলা)*</label>
                        <input
                          type="text"
                          value={memberFormName}
                          onChange={(e) => setMemberFormName(e.target.value)}
                          placeholder="উদা: মোঃ আরমান হোসেন"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-600 text-xs">পদবী / রোল*</label>
                        <input
                          type="text"
                          value={memberFormDesg}
                          onChange={(e) => setMemberFormDesg(e.target.value)}
                          placeholder="উদা: দপ্তর সম্পাদক (Office Secretary)"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-600 text-xs">মোবাইল নম্বর</label>
                        <input
                          type="text"
                          value={memberFormMobile}
                          onChange={(e) => setMemberFormMobile(e.target.value)}
                          placeholder="উদা: 01701633900"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingMember(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border-0"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-light rounded-xl transition-all border-0 shadow-sm"
                      >
                        সদস্য যুক্ত করুন
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Grid display for members */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {committee.map(member => {
                const isEditingThis = editingMemberId === member.id;
                return (
                  <div 
                    key={member.id} 
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {isEditingThis ? (
                      /* Active Member Edit Mode Form */
                      <form onSubmit={handleMemberSubmit} className="p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">সদস্য তথ্য সম্পাদনা</span>
                          <button type="button" onClick={() => setEditingMemberId(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={15} />
                          </button>
                        </div>

                        {/* Photo input with preview */}
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200">
                            <img src={memberFormPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">ছবি আপলোড (১.৫ MB সর্বোচ্চ)</label>
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, 'member')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 border border-slate-200">
                                <Upload size={12} />
                                ছবি নির্বাচন করুন
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="block font-bold text-slate-600 mb-0.5">নাম (বাংলা)*</label>
                            <input
                              type="text"
                              value={memberFormName}
                              onChange={(e) => setMemberFormName(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-0.5">পদবী*</label>
                            <input
                              type="text"
                              value={memberFormDesg}
                              onChange={(e) => setMemberFormDesg(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-0.5">মোবাইল নম্বর</label>
                            <input
                              type="text"
                              value={memberFormMobile}
                              onChange={(e) => setMemberFormMobile(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-primary"
                            />
                          </div>
                        </div>

                        <div className="flex gap-1.5 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingMemberId(null)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold rounded-lg text-slate-500 cursor-pointer border-0"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border-0 shadow-sm"
                          >
                            <Save size={11} />
                            সংরক্ষণ
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Read-Only Committee Member Display */
                      <>
                        <div className="p-5 flex items-start gap-4">
                          {/* Profile Picture Frame */}
                          <div className="w-18 h-18 rounded-2xl overflow-hidden border-2 border-emerald-600/10 shadow-inner flex-shrink-0 bg-slate-50 relative group-hover:scale-105 transition-transform">
                            <img 
                              src={member.photo} 
                              alt={member.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Member info block */}
                          <div className="space-y-1 overflow-hidden">
                            <h4 className="text-xs font-black text-slate-900 leading-snug truncate" title={member.name}>
                              {member.name}
                            </h4>
                            <p className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded-md leading-none border border-emerald-500/10">
                              {member.designation}
                            </p>
                            {member.mobile && (
                              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-semibold">
                                <Phone size={10} className="text-slate-400" />
                                {toBanglaDigits(member.mobile)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Admin actions inside Card */}
                        {isAdmin && (
                          <div className="bg-slate-50/50 px-5 py-2.5 border-t border-slate-100 flex justify-end gap-2">
                            <button
                              onClick={() => startEditMember(member)}
                              className="px-3 py-1 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border border-primary/10"
                            >
                              <Edit2 size={11} />
                              এডিট করুন
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border border-rose-200"
                            >
                              <Trash2 size={11} />
                              মুছে ফেলুন
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Bank Signatories (৩ জন) */}
        {subTab === 'bank_sign' && (
          <div className="space-y-6">
            {/* Header info for Bank Signatories */}
            <div className="bg-blue-950/5 p-4 rounded-xl border border-blue-950/10 flex items-start gap-2.5 text-xs">
              <Landmark className="text-blue-700 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <p className="font-bold text-slate-800">ব্যাংক পরিচালনা সদস্য (Authorized Signatories)</p>
                <p className="text-slate-500 mt-1">জনতা ব্যাংক পিএলসি, ময়মনসিংহ শাখা এর হিসাব নম্বর: ০১০০২৯৪২৭৮৫৫৩ "আল-বারাকা" অ্যাকাউন্টটি যৌথভাবে পরিচালনার জন্য নির্ধারিত ৩ জন স্বাক্ষরকারী সদস্য।</p>
              </div>
            </div>

            {/* Admin Add Bank Signatory Button & Block */}
            {isAdmin && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                {!isAddingSig ? (
                  <button
                    onClick={() => {
                      setIsAddingSig(true);
                      setSigFormName('');
                      setSigFormDesg('');
                      setSigFormMobile('');
                      setSigFormPhoto(createAvatarSvg('%230369a1', 'SIGN'));
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border-0 shadow-sm transition-colors"
                  >
                    <Plus size={15} />
                    নতুন ব্যাংক স্বাক্ষরকারী সদস্য যোগ করুন
                  </button>
                ) : (
                  <form onSubmit={handleSigSubmit} className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                      <h3 className="text-sm font-bold text-primary flex items-center gap-1">
                        <Landmark size={16} className="text-gold" />
                        নতুন ব্যাংক স্বাক্ষরকারী পরিচালনা সদস্য যুক্ত করুন
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsAddingSig(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Photo input with preview */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-600/10 shadow-inner flex-shrink-0 bg-slate-50">
                        <img src={sigFormPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">ছবি আপলোড (১.৫ MB সর্বোচ্চ)</label>
                        <div className="relative inline-block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, 'sig')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200">
                            <Upload size={14} />
                            ছবি নির্বাচন করুন
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-600 text-xs">নাম (বাংলা)*</label>
                        <input
                          type="text"
                          value={sigFormName}
                          onChange={(e) => setSigFormName(e.target.value)}
                          placeholder="উদা: রাকিবুল হাসান (শিপন)"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-600 text-xs">পদবী / রোল*</label>
                        <input
                          type="text"
                          value={sigFormDesg}
                          onChange={(e) => setSigFormDesg(e.target.value)}
                          placeholder="উদা: কোষাধ্যক্ষ ও ৩য় স্বাক্ষরকারী"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-600 text-xs">মোবাইল নম্বর</label>
                        <input
                          type="text"
                          value={sigFormMobile}
                          onChange={(e) => setSigFormMobile(e.target.value)}
                          placeholder="উদা: 01911919786"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingSig(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border-0"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-light rounded-xl transition-all border-0 shadow-sm"
                      >
                        স্বাক্ষরকারী যুক্ত করুন
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Grid display for signatories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {signatories.map(sig => {
                const isEditingThis = editingSigId === sig.id;
                return (
                  <div 
                    key={sig.id} 
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {isEditingThis ? (
                      /* Active Signatory Edit Form */
                      <form onSubmit={handleSigSubmit} className="p-4 space-y-3.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">স্বাক্ষরকারী তথ্য সম্পাদনা</span>
                          <button type="button" onClick={() => setEditingSigId(null)} className="text-slate-400 hover:text-slate-600">
                            <X size={15} />
                          </button>
                        </div>

                        {/* Photo input with preview */}
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200">
                            <img src={sigFormPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">ছবি আপলোড (১.৫ MB সর্বোচ্চ)</label>
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(e, 'sig')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 border border-slate-200">
                                <Upload size={12} />
                                ছবি নির্বাচন করুন
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="block font-bold text-slate-600 mb-0.5">নাম (বাংলা)*</label>
                            <input
                              type="text"
                              value={sigFormName}
                              onChange={(e) => setSigFormName(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-0.5">পদবী*</label>
                            <input
                              type="text"
                              value={sigFormDesg}
                              onChange={(e) => setSigFormDesg(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-600 mb-0.5">মোবাইল নম্বর</label>
                            <input
                              type="text"
                              value={sigFormMobile}
                              onChange={(e) => setSigFormMobile(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-primary"
                            />
                          </div>
                        </div>

                        <div className="flex gap-1.5 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingSigId(null)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold rounded-lg text-slate-500 cursor-pointer border-0"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer border-0 shadow-sm"
                          >
                            <Save size={11} />
                            সংরক্ষণ
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Read-Only display */
                      <>
                        <div className="p-6 text-center space-y-4">
                          {/* Portrait Photo */}
                          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-500/15 shadow-md mx-auto bg-slate-50 relative group-hover:scale-105 transition-transform duration-300">
                            <img 
                              src={sig.photo} 
                              alt={sig.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Info block */}
                          <div className="space-y-1 px-2">
                            <h4 className="text-sm font-black text-slate-900 leading-snug">
                              {sig.name}
                            </h4>
                            <p className="text-[10px] font-extrabold text-blue-700 bg-blue-50 inline-block px-3 py-0.5 rounded-full border border-blue-500/10">
                              {sig.designation}
                            </p>
                            {sig.mobile && (
                              <p className="text-[11px] text-slate-500 font-mono font-bold flex items-center justify-center gap-1 pt-1">
                                <Phone size={11} className="text-slate-400" />
                                {toBanglaDigits(sig.mobile)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Admin actions */}
                        {isAdmin && (
                          <div className="bg-slate-50/50 px-5 py-3 border-t border-slate-100 flex justify-center gap-3">
                            <button
                              onClick={() => startEditSig(sig)}
                              className="px-4 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer border border-primary/10 shadow-sm"
                            >
                              <Edit2 size={12} />
                              এডিট করুন
                            </button>
                            <button
                              onClick={() => handleDeleteSig(sig.id)}
                              className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer border border-rose-200 shadow-sm"
                            >
                              <Trash2 size={12} />
                              মুছে ফেলুন
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
