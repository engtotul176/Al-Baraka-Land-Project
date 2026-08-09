/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, Payment, SystemSettings, SmsLog } from '../types';
import { toBanglaDigits } from '../utils';
import { 
  sendSms, 
  fetchSmsBalance, 
  getSmsLogs, 
  clearSmsLogs, 
  formatPaymentSmsMessage 
} from '../utils/smsService';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Settings, 
  Users, 
  Phone, 
  FileText, 
  Sparkles,
  Search,
  Trash2,
  Lock
} from 'lucide-react';

interface SmsPanelSheetProps {
  members: Member[];
  payments: Payment[];
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  isAdmin?: boolean;
}

export default function SmsPanelSheet({
  members,
  payments,
  settings,
  onUpdateSettings,
  isAdmin = true
}: SmsPanelSheetProps) {
  const [activeTab, setActiveTab] = useState<'send' | 'logs' | 'config'>('send');
  
  // Balance State
  const [balance, setBalance] = useState<string | null>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Send Form State
  const [targetType, setTargetType] = useState<'single' | 'all' | 'custom'>('single');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [customMobile, setCustomMobile] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Filter for members search
  const [searchQuery, setSearchQuery] = useState('');

  // Logs state
  const [logs, setLogs] = useState<SmsLog[]>([]);

  // Load logs and fetch balance on mount
  useEffect(() => {
    setLogs(getSmsLogs());
    handleCheckBalance();
  }, []);

  const handleCheckBalance = async () => {
    setIsFetchingBalance(true);
    setBalanceError(null);
    try {
      const res = await fetchSmsBalance(settings);
      if (res.success && res.balance !== undefined) {
        setBalance(res.balance);
      } else {
        setBalanceError(res.message);
      }
    } catch {
      setBalanceError('ব্যালেন্স সার্ভিস কানেক্ট করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsFetchingBalance(false);
    }
  };

  // When member selected, update custom mobile and recipient name
  useEffect(() => {
    if (targetType === 'single' && selectedMemberId) {
      const m = members.find(mem => mem.memberId === selectedMemberId);
      if (m) {
        setCustomMobile(m.mobile);
        setRecipientName(m.name);
        
        // Calculate member total savings
        const mPayments = payments.filter(p => p.memberId === m.memberId);
        const totalSavings = mPayments.reduce((sum, p) => sum + p.amount, 0);

        // Pre-fill message with default payment SMS for this member
        const formatted = formatPaymentSmsMessage(settings.smsTemplate, {
          memberName: m.name,
          month: 'চলতি মাস',
          year: new Date().getFullYear(),
          amount: settings.monthlyAmount,
          receiptNo: 'REC-XXXX',
          totalSavings
        });
        setMessageText(formatted);
      }
    }
  }, [selectedMemberId, targetType, members, payments, settings]);

  // Preset Template Selectors
  const applyPresetTemplate = (templateType: 'payment' | 'due' | 'meeting' | 'eid' | 'notice') => {
    const selectedMem = members.find(m => m.memberId === selectedMemberId);
    const mName = selectedMem ? selectedMem.name : '[সদস্যের নাম]';

    switch (templateType) {
      case 'payment': {
        const mPayments = selectedMem ? payments.filter(p => p.memberId === selectedMem.memberId) : [];
        const totalSavings = mPayments.reduce((sum, p) => sum + p.amount, 0);
        setMessageText(`সম্মানিত সদস্য ${mName}, আল-বারাকা ভূমি প্রকল্প এ আপনার মাসিক সঞ্চয় জমা পাওয়া গেছে। আপনার মোট জমা: ${toBanglaDigits(totalSavings)} টাকা। ধন্যবাদ!`);
        break;
      }
      case 'due':
        setMessageText(`সম্মানিত সদস্য ${mName}, আল-বারাকা ভূমি প্রকল্প এর চলতি মাসের সঞ্চয়ের টাকা জমাদানের অনুরোধ করা হচ্ছে। জমার পরিমাণ: ${toBanglaDigits(settings.monthlyAmount)} টাকা। ধন্যবাদ।`);
        break;
      case 'meeting':
        setMessageText(`সম্মানিত সদস্য ${mName}, আগামী শুক্রবার বিকাল ৪:০০ ঘটিকায় আল-বারাকা ভূমি প্রকল্প এর সাধারণ সভা অনুষ্ঠিত হবে। আপনার উপস্থিতি একান্ত কাম্য।`);
        break;
      case 'eid':
        setMessageText(`সম্মানিত সদস্য ${mName}, আল-বারাকা ভূমি প্রকল্প এর পক্ষ থেকে আপনাকে ও আপনার পরিবারকে পবিত্র ঈদের আন্তরিক শুভেচ্ছা ও মোবারকবাদ! ঈদ মোবারক!`);
        break;
      case 'notice':
        setMessageText(`সম্মানিত সদস্য ${mName}, আল-বারাকা ভূমি প্রকল্প এর নতুন আপডেট ও তথ্য দেখতে ভিজিট করুন। মোবাইল: ${settings.orgMobile}। ধন্যবাদ।`);
        break;
    }
  };

  // Submit Send SMS
  const handleSendSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      alert('মেসেজের বিবরণী লিখুন!');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      if (targetType === 'single' || targetType === 'custom') {
        const mobileToUse = targetType === 'single' ? customMobile : customMobile;
        const nameToUse = targetType === 'single' ? recipientName : 'গ্রাহক';

        if (!mobileToUse) {
          alert('মোবাইল নম্বর প্রদান করুন!');
          setIsSending(false);
          return;
        }

        const res = await sendSms(mobileToUse, messageText, settings, nameToUse, 'manual');
        setSendResult(res);
        setLogs(getSmsLogs());
        handleCheckBalance();
      } else if (targetType === 'all') {
        // Bulk send to all active members with phone numbers
        const activeMembers = members.filter(m => m.status === 'Active' && m.mobile && m.mobile.length >= 11);
        if (activeMembers.length === 0) {
          alert('কোনো সক্রিয় সদস্যের বৈধ মোবাইল নম্বর পাওয়া যায়নি!');
          setIsSending(false);
          return;
        }

        const confirmBulk = window.confirm(`আপনি কি নিশ্চিতভাবে মোট ${toBanglaDigits(activeMembers.length)} জন সদস্যকে একসাথে এই বাল্ক এসএমএস পাঠাতে চান?`);
        if (!confirmBulk) {
          setIsSending(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const m of activeMembers) {
          // Replace placeholders if any
          const mPayments = payments.filter(p => p.memberId === m.memberId);
          const totalSavings = mPayments.reduce((sum, p) => sum + p.amount, 0);

          const personalizedMsg = messageText.replace(/\[সদস্যের নাম\]|\{memberName\}/g, m.name)
            .replace(/\{totalSavings\}/g, toBanglaDigits(totalSavings));

          const res = await sendSms(m.mobile, personalizedMsg, settings, m.name, 'bulk');
          if (res.success) {
            successCount++;
          } else {
            failCount++;
          }
        }

        setSendResult({
          success: true,
          message: `বাল্ক এসএমএস সম্পন্ন! মোট প্রেরিত: ${toBanglaDigits(successCount)} টি, ব্যর্থ: ${toBanglaDigits(failCount)} টি।`
        });
        setLogs(getSmsLogs());
        handleCheckBalance();
      }
    } catch (err: any) {
      setSendResult({ success: false, message: err.message || 'এসএমএস পাঠাতে ব্যর্থ হয়েছে।' });
    } finally {
      setIsSending(false);
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে সকল এসএমএস ইতিহাস মুছে ফেলতে চান?')) {
      clearSmsLogs();
      setLogs([]);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.mobile.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <MessageSquare className="text-gold" />
            বাল্ক এসএমএস ও নোটিফিকেশন সেন্টার (BulkSMSBD)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            BulkSMSBD সার্ভিস ব্যবহার করে সকল সদস্যকে অটোমেটিক এবং ম্যানুয়াল এসএমএস পাঠান।
          </p>
        </div>

        {/* Balance Display Box */}
        <div className="bg-gradient-to-r from-emerald-900 to-primary text-white px-4 py-3 rounded-2xl flex items-center gap-4 shadow-sm border border-emerald-700/50 shrink-0">
          <div>
            <p className="text-[10px] text-emerald-200/80 uppercase font-bold tracking-wider">BulkSMSBD ব্যালেন্স</p>
            <p className="text-lg font-black text-amber-300 font-mono mt-0.5">
              {balance !== null ? `৳ ${toBanglaDigits(balance)}` : (balanceError ? 'কানেক্টেড নয়' : 'চেক করা হচ্ছে...')}
            </p>
          </div>
          <button
            onClick={handleCheckBalance}
            disabled={isFetchingBalance}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="ব্যালেন্স রিফ্রেশ করুন"
          >
            <RefreshCw size={16} className={isFetchingBalance ? "animate-spin text-amber-300" : ""} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('send')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'send'
              ? 'bg-primary text-white border-b-2 border-gold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Send size={14} />
          নতুন এসএমএস পাঠান
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-primary text-white border-b-2 border-gold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <History size={14} />
          এসএমএস ইতিহাস ({toBanglaDigits(logs.length)})
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'config'
              ? 'bg-primary text-white border-b-2 border-gold shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Settings size={14} />
          এসএমএস কনফিগারেশন
        </button>
      </div>

      {/* TAB 1: SEND SMS */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Column */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 space-y-5">
            <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Send size={16} className="text-gold" />
              মেসেজ প্রেরণের বিবরণী
            </h3>

            <form onSubmit={handleSendSmsSubmit} className="space-y-4">
              {/* Target Type Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">কাকে পাঠাতে চান?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('single')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'single'
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users size={14} />
                    একক সদস্য
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'all'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles size={14} />
                    সকল সদস্য (বাল্ক)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('custom')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      targetType === 'custom'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Phone size={14} />
                    কাস্টম মোবাইল
                  </button>
                </div>
              </div>

              {/* Single Member Selector */}
              {targetType === 'single' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">সদস্য নির্বাচন করুন*</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="নাম, সদস্য আইডি বা মোবাইল দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 mb-2 focus:outline-none focus:border-primary"
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  </div>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="">-- মেম্বার সিলেক্ট করুন --</option>
                    {filteredMembers.map((m) => (
                      <option key={m.memberId} value={m.memberId}>
                        {m.memberId} - {m.name} ({m.mobile || 'মোবাইল নেই'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Mobile Input */}
              {targetType === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">প্রাপকের মোবাইল নম্বর (১১ ডিজিট)*</label>
                  <input
                    type="text"
                    value={customMobile}
                    onChange={(e) => setCustomMobile(e.target.value)}
                    placeholder="যেমন: 01712345678"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold"
                  />
                </div>
              )}

              {/* Bulk Send Info Warning */}
              {targetType === 'all' && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold flex items-center gap-1">📢 বাল্ক এসএমএস মোড সক্রিয়:</p>
                  <p>
                    ডাটাবেজের মোট <strong>{toBanglaDigits(members.filter(m => m.status === 'Active').length)} জন সক্রিয় সদস্যের</strong> প্রত্যেকের মোবাইলে পৃথকভাবে এই মেসেজটি পাঠানো হবে।
                  </p>
                </div>
              )}

              {/* Message Composer Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600">বাংলা মেসেজের বিস্তারিত বিবরণী*</label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    দৈর্ঘ্য: <strong className="text-primary">{messageText.length}</strong> অক্ষর (আনুমানিক {Math.ceil(messageText.length / 160) || 1} টি SMS)
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="এখানে বাংলা মেসেজ লিখুন..."
                  className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-sans leading-relaxed"
                />
              </div>

              {/* Outcome Feedback Banner */}
              {sendResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-bold ${
                  sendResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {sendResult.success ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                  <span>{sendResult.message}</span>
                </div>
              )}

              {/* Send Button */}
              <button
                type="submit"
                disabled={isSending || !isAdmin}
                className="w-full py-3 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-gold" />
                    এসএমএস পাঠানো হচ্ছে...
                  </>
                ) : (
                  <>
                    <Send size={16} className="text-gold" />
                    এসএমএস পাঠান (Send SMS)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Preset Templates Column */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <FileText size={14} className="text-gold" />
                তাত্ক্ষণিক টেমপ্লেটসমূহ (Quick Presets)
              </h4>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('payment')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer block"
                >
                  <span className="text-primary font-bold block mb-0.5">💰 টাকা জমার কনফার্মেশন</span>
                  <span className="text-[11px] text-slate-500 line-clamp-2">আল-বারাকা ভূমি প্রকল্প এ জমা প্রাপ্তির রশিদ নোটিশ।</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate('due')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-amber-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 hover:border-amber-300 transition-all cursor-pointer block"
                >
                  <span className="text-amber-700 font-bold block mb-0.5">⚠️ বকেয়া জমা তাগাদা</span>
                  <span className="text-[11px] text-slate-500 line-clamp-2">চলতি মাসের সঞ্চয়ের টাকা জমাদানের অনুরোধ।</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate('meeting')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-sky-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 hover:border-sky-300 transition-all cursor-pointer block"
                >
                  <span className="text-sky-700 font-bold block mb-0.5">📅 সাধারণ সভা নোটিশ</span>
                  <span className="text-[11px] text-slate-500 line-clamp-2">মাসিক/সাধারণ সভায় অংশগ্রহণের আমন্ত্রণ।</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate('eid')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-purple-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 hover:border-purple-300 transition-all cursor-pointer block"
                >
                  <span className="text-purple-700 font-bold block mb-0.5">🌙 ঈদ ও শুভেচ্ছা বার্তা</span>
                  <span className="text-[11px] text-slate-500 line-clamp-2">ঈদুল ফিতর/ঈদুল আজহা এবং শুভকামনা বার্তা।</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetTemplate('notice')}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer block"
                >
                  <span className="text-slate-800 font-bold block mb-0.5">📢 প্রকল্পের সাধারণ নোটিশ</span>
                  <span className="text-[11px] text-slate-500 line-clamp-2">নতুন তথ্য ও যোগাযোগের অফিস নম্বর।</span>
                </button>
              </div>
            </div>

            {/* API Credentials Quick Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>BulkSMSBD সার্ভিস তথ্য</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">সক্রিয়</span>
              </div>
              <p>Sender ID: <strong className="font-mono text-primary">{settings.smsSenderId || '8809648909593'}</strong></p>
              <p>API Key: <strong className="font-mono text-slate-700">{settings.smsApiKey ? '••••••••' + settings.smsApiKey.slice(-4) : 'SSUCS5sjSU4MFQZcJT8c'}</strong></p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SMS LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <History size={16} className="text-gold" />
                প্রেরিত সকল এসএমএস এর ইতিহাস (Sent SMS History)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                পূর্বে পাঠানো সকল অটোমেটিক ও ম্যানুয়াল মেসেজের তথ্য।
              </p>
            </div>

            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                disabled={!isAdmin}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 size={13} />
                ইতিহাস মুছুন
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <MessageSquare size={36} className="mx-auto text-slate-300" />
              <p>এখনো কোনো এসএমএস পাঠানো হয়নি!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3">তারিখ ও সময়</th>
                    <th className="p-3">প্রাপক</th>
                    <th className="p-3">মোবাইল</th>
                    <th className="p-3">মেসেজের বিবরণী</th>
                    <th className="p-3">টাইপ</th>
                    <th className="p-3">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{log.sentAt}</td>
                      <td className="p-3 font-bold text-slate-800">{log.recipientName}</td>
                      <td className="p-3 font-mono text-primary font-bold">{log.mobile}</td>
                      <td className="p-3 text-slate-700 max-w-md break-words">{log.message}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.type === 'auto_payment'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.type === 'bulk'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-sky-800'
                        }`}>
                          {log.type === 'auto_payment' ? 'অটো পেমেন্ট' : log.type === 'bulk' ? 'বাল্ক' : 'ম্যানুয়াল'}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          log.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {log.status === 'sent' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {log.status === 'sent' ? 'সফল (Sent)' : 'ব্যর্থ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Settings size={16} className="text-gold" />
            BulkSMSBD API সেটিংস ও অটোমেটিক মেসেজ টেমপ্লেট
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">BulkSMSBD API Key*</label>
              <input
                type="text"
                value={settings.smsApiKey || ''}
                onChange={(e) => onUpdateSettings({ ...settings, smsApiKey: e.target.value.trim() })}
                placeholder="SSUCS5sjSU4MFQZcJT8c"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold"
                disabled={!isAdmin}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Approved Sender ID*</label>
              <input
                type="text"
                value={settings.smsSenderId || ''}
                onChange={(e) => onUpdateSettings({ ...settings, smsSenderId: e.target.value.trim() })}
                placeholder="8809648909593"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold"
                disabled={!isAdmin}
              />
            </div>
          </div>

          {/* Auto Send Checkbox */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.smsAutoSendOnPayment !== false}
                onChange={(e) => onUpdateSettings({ ...settings, smsAutoSendOnPayment: e.target.checked })}
                className="rounded border-slate-300 text-primary focus:ring-primary w-5 h-5 cursor-pointer mt-0.5"
                disabled={!isAdmin}
              />
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  পেমেন্ট এন্ট্রিতে অটোমেটিক এসএমএস পাঠান (Auto SMS on Payment Entry)
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  সক্রিয় থাকলে, মেম্বারের কোনো নতুন পেমেন্ট/জমা এন্ট্রি দেওয়ামাত্রই তার মোবাইলে অটোমেটিক বাংলায় মেসেজ চলে যাবে।
                </p>
              </div>
            </label>
          </div>

          {/* Default Template Editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              অটোমেটিক পেমেন্ট মেসেজ টেমপ্লেট (বাংলা)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              মেসেজের ভেতর ডাইনামিক ফিল্ড যুক্ত করতে ডায়নামিক ট্যাগ ব্যবহার করুন: <code className="bg-slate-100 text-primary font-bold px-1 py-0.5 rounded">{'{memberName}'}</code>, <code className="bg-slate-100 text-primary font-bold px-1 py-0.5 rounded">{'{month}'}</code>, <code className="bg-slate-100 text-primary font-bold px-1 py-0.5 rounded">{'{amount}'}</code>, <code className="bg-slate-100 text-primary font-bold px-1 py-0.5 rounded">{'{receiptNo}'}</code>, <code className="bg-slate-100 text-primary font-bold px-1 py-0.5 rounded">{'{totalSavings}'}</code>
            </p>
            <textarea
              rows={4}
              value={settings.smsTemplate || ''}
              onChange={(e) => onUpdateSettings({ ...settings, smsTemplate: e.target.value })}
              className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-sans leading-relaxed"
              disabled={!isAdmin}
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() => alert('সেটিংস অটোমেটিক সংরক্ষিত হয়েছে!')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <CheckCircle2 size={16} />
              কনফিগারেশন সেভ হয়েছে
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
