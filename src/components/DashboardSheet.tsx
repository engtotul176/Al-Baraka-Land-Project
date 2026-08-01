/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Payment, BankDeposit, BankWithdrawal, ExpenseEntry, UserSession } from '../types';
import { toBanglaDigits, formatCurrencyBangla, getTodayBanglaDate } from '../utils';
import { 
  Users, Landmark, Wallet, Layers, AlertCircle, ArrowUpRight, TrendingUp, Calendar, BadgeCheck, Receipt,
  Activity, Eye, Radio, Clock, Laptop, Smartphone, X, ShieldCheck
} from 'lucide-react';

interface DashboardSheetProps {
  members: Member[];
  payments: Payment[];
  bankDeposits: BankDeposit[];
  bankWithdrawals?: BankWithdrawal[];
  expenses?: ExpenseEntry[];
  liveSessions?: UserSession[];
  isAdmin?: boolean;
  onSelectTab: (tab: string) => void;
  onSelectReceipt: (receiptNo: string) => void;
}

export default function DashboardSheet({
  members,
  payments,
  bankDeposits,
  bankWithdrawals = [],
  expenses = [],
  liveSessions = [],
  isAdmin = true,
  onSelectTab,
  onSelectReceipt
}: DashboardSheetProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  
  // Live Active Tracker Modal States
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveModalTab, setLiveModalTab] = useState<'live' | 'today'>('live');

  // Live User Tracker Logic
  const nowTime = Date.now();
  const currentlyLiveList = liveSessions.filter(s => {
    if (!s.lastActive) return false;
    const timeDiff = nowTime - new Date(s.lastActive).getTime();
    return timeDiff >= 0 && timeDiff < 45000; // heartbeat within 45s
  });

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayVisitorsList = liveSessions.filter(s => {
    if (!s.lastActive) return false;
    return (s.firstSeenToday === todayDateStr) || s.lastActive.startsWith(todayDateStr);
  });

  // Format relative time in Bangla
  const formatRelativeTime = (isoString: string) => {
    if (!isoString) return 'অজানা';
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 15) return 'এইমাত্র';
    if (diffSec < 60) return `${toBanglaDigits(diffSec)} সেকেন্ড আগে`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${toBanglaDigits(diffMin)} মিনিট আগে`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${toBanglaDigits(diffHr)} ঘণ্টা আগে`;
    return `${toBanglaDigits(Math.floor(diffHr / 24))} দিন আগে`;
  };

  // Format clock time in Bangla
  const formatTimeOnly = (isoString: string) => {
    if (!isoString) return '―';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '―';
    }
  };

  // Core metrics calculation
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  
  const totalCollection = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalBankDeposit = bankDeposits.reduce((sum, b) => sum + b.amount, 0);
  const totalBankWithdrawal = bankWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const netBankBalance = Math.max(0, totalBankDeposit - totalBankWithdrawal);

  // Cash in hand
  const cashFromWithdrawals = bankWithdrawals
    .filter(w => w.withdrawPurpose === 'Cash in Hand')
    .reduce((sum, w) => sum + w.amount, 0);

  const cashExpenses = expenses
    .filter(e => e.paidFrom === 'Cash in Hand')
    .reduce((sum, e) => sum + e.amount, 0);

  const cashInHand = Math.max(0, totalCollection - totalBankDeposit + cashFromWithdrawals - cashExpenses);

  // Total Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Current Month Collection dynamically calculated based on actual current date
  const now = new Date();
  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthsBangla: Record<string, string> = {
    "January": "জানুয়ারি",
    "February": "ফেব্রুয়ারি",
    "March": "মার্চ",
    "April": "এপ্রিল",
    "May": "মে",
    "June": "জুন",
    "July": "জুলাই",
    "August": "আগস্ট",
    "September": "সেপ্টেম্বর",
    "October": "অক্টোবর",
    "November": "নভেম্বর",
    "December": "ডিসেম্বর"
  };

  const currentMonth = monthsList[now.getMonth()]; 
  const currentYear = now.getFullYear();

  const currentMonthCollection = payments
    .filter(p => p.month === currentMonth && p.year === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);

  // Due members calculation for current real-world month
  const activePaidCurrentMonth = new Set(
    payments
      .filter(p => p.month === currentMonth && p.year === currentYear && p.paymentType === "Monthly Deposit")
      .map(p => p.memberId)
  );
  const dueMembersCount = Math.max(0, activeMembers - activePaidCurrentMonth.size);

  // Last Collection Details: Sort by year and receipt sequence descending so the latest posted payment always appears first
  const sortedPayments = [...payments].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    const getSeq = (p: Payment) => {
      const match = p.receiptNo.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    };
    const seqA = getSeq(a);
    const seqB = getSeq(b);
    if (seqA !== seqB) {
      return seqB - seqA;
    }
    return b.entryDate.localeCompare(a.entryDate);
  });
  const lastPayment = sortedPayments[0];

  // Prepare monthly chart data (All 12 months for current year)
  const chartData = monthsList.map(m => {
    const amount = payments
      .filter(p => p.month === m && p.year === currentYear)
      .reduce((sum, p) => sum + p.amount, 0);
    return {
      month: m,
      monthBangla: monthsBangla[m],
      amount
    };
  });

  const maxAmount = Math.max(...chartData.map(d => d.amount), 10000);

  // Simple Recent Activities (last 5 payments)
  const recentPayments = sortedPayments.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Banner / Title Panel */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-6 rounded-2xl border-b-4 border-gold shadow-md text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-gold text-primary text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">ড্যাশবোর্ড</span>
            <span className="text-gray-300 text-sm font-mono">{toBanglaDigits("2026")} - {toBanglaDigits("2027")} অর্থবছর</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-2 font-sans flex items-center gap-2">
            আল-বারাকা স্মার্ট ম্যানেজমেন্ট সিস্টেম
          </h1>
          <p className="text-gold-light text-sm mt-1 font-sans font-light">
            প্রতিষ্ঠাতা: প্রকৌশলী মোঃ তানভীন আহমেদ টুটুল | মোবাইল: {toBanglaDigits("01672965561")}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 text-center md:text-right">
          <p className="text-xs text-gray-300">আজকের তারিখ (সিস্টেম)</p>
          <p className="text-lg font-bold text-gold mt-0.5 font-mono">{getTodayBanglaDate()}</p>
        </div>
      </div>

      {/* Live Active Tracker & Daily Visitor Section (Admin Only) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Currently Live Users Card */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 p-5 rounded-2xl shadow-md border border-emerald-700/50 text-white flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                </span>
                <span className="text-xs font-bold text-emerald-200 tracking-wide uppercase flex items-center gap-1">
                  <Radio size={13} className="text-emerald-300 animate-pulse" /> বর্তমানে অনলাইনে আছেন (Live)
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-emerald-300">{toBanglaDigits(currentlyLiveList.length)}</span>
                <span className="text-sm font-semibold text-emerald-100">জন মেম্বার/ইউজার</span>
              </div>
              <p className="text-xs text-emerald-200/80">
                রিয়েল-টাইম ১৫ সেকেন্ডের সংকেত (Heartbeat) সক্রিয় রয়েছে
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 z-10">
              <button
                onClick={() => {
                  setLiveModalTab('live');
                  setIsLiveModalOpen(true);
                }}
                className="px-3 py-2 bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/40 text-emerald-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105"
              >
                <Eye size={14} /> লাইভ তালিকা দেখুন
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none text-emerald-300">
              <Activity size={110} />
            </div>
          </div>

          {/* Today's Total App Visitors Card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl shadow-md border border-indigo-800/40 text-white flex items-center justify-between relative overflow-hidden">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-indigo-500/20 text-indigo-300 rounded-md">
                  <Users size={14} />
                </span>
                <span className="text-xs font-bold text-indigo-200 tracking-wide uppercase">
                  আজকে মোট অ্যাপে ঢুকেছেন (Today's Visits)
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-indigo-300">{toBanglaDigits(todayVisitorsList.length)}</span>
                <span className="text-sm font-semibold text-indigo-100">জন ভিজিটর</span>
              </div>
              <p className="text-xs text-indigo-200/80">
                আজকে রাত ১২টা থেকে অনন্য অ্যাপ ভিজিটের মোট সংখ্যা
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 z-10">
              <button
                onClick={() => {
                  setLiveModalTab('today');
                  setIsLiveModalOpen(true);
                }}
                className="px-3 py-2 bg-indigo-500/30 hover:bg-indigo-500/50 border border-indigo-400/40 text-indigo-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105"
              >
                <Clock size={14} /> ভিজিটর হিস্ট্রি
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none text-indigo-300">
              <Users size={110} />
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Members */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-gold transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">মোট সদস্য সংখ্যা</p>
            <p className="text-2xl font-bold text-primary">{toBanglaDigits(totalMembers)} জন</p>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              সক্রিয়: {toBanglaDigits(activeMembers)} জন
            </p>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
            <Users size={24} />
          </div>
        </div>

        {/* Metric 2: Total Collection */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-gold transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">সর্বমোট আদায় (তহবিল)</p>
            <p className="text-2xl font-bold text-primary font-mono">{formatCurrencyBangla(totalCollection)}</p>
            <p className="text-xs text-slate-400">নিবন্ধিত সকল সদস্যের জমার সমষ্টি</p>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-xl text-primary group-hover:scale-110 transition-transform duration-300">
            <TrendingUp size={24} className="text-emerald-700" />
          </div>
        </div>

        {/* Metric 3: Bank Balance */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-gold transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">বর্তমান ব্যাংক ব্যালেন্স</p>
            <p className="text-2xl font-bold text-emerald-800 font-mono">{formatCurrencyBangla(netBankBalance)}</p>
            <button 
              onClick={() => onSelectTab('bank')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 mt-1 cursor-pointer"
            >
              ব্যাংক & চেক রেজিস্টার <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-xl text-blue-700 group-hover:scale-110 transition-transform duration-300">
            <Landmark size={24} />
          </div>
        </div>

        {/* Metric 4: Cash in Hand */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-gold transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">হাতে নগদ অবশিষ্ট ফান্ড</p>
            <p className="text-2xl font-bold text-amber-700 font-mono">{formatCurrencyBangla(cashInHand)}</p>
            <p className="text-xs text-slate-400">ক্যাশ ইন হ্যান্ড অবশিষ্ট স্থিতি</p>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-700 group-hover:scale-110 transition-transform duration-300">
            <Wallet size={24} />
          </div>
        </div>
      </div>

      {/* Secondary Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 5: Current Month Collection */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-800">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">চলতি মাসের আদায় ({monthsBangla[currentMonth]})</p>
            <p className="text-lg font-bold text-primary mt-0.5">{formatCurrencyBangla(currentMonthCollection)}</p>
          </div>
        </div>

        {/* Metric 6: Due Members */}
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 flex items-center gap-3 hover:shadow-sm cursor-pointer" onClick={() => onSelectTab('reports')}>
          <div className="p-2.5 bg-rose-100 rounded-lg text-rose-700 animate-pulse">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">চলতি মাসের বকেয়া সদস্য</p>
            <p className="text-lg font-bold text-rose-700 mt-0.5">{toBanglaDigits(dueMembersCount)} জন</p>
          </div>
        </div>

        {/* Metric 7: Last Collection */}
        <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 rounded-lg text-amber-800">
            <BadgeCheck size={18} />
          </div>
          <div className="truncate flex-1">
            <p className="text-xs text-slate-500 font-medium">সর্বশেষ আদায় বিবরণ</p>
            {lastPayment ? (
              <div className="truncate">
                <span className="text-sm font-bold text-primary">{lastPayment.memberName}</span>
                <span className="text-xs text-amber-800 font-mono ml-2">({formatCurrencyBangla(lastPayment.amount)})</span>
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-400 mt-0.5">কোনো লেনদেন নেই</p>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Analytics Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection Graph Panel */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gold rounded-full inline-block"></span>
                মাসিক আদায় চিত্র (২০২৬)
              </h2>
              <span className="text-xs text-slate-400 font-mono">মানসমূহ বাংলায় প্রদর্শিত</span>
            </div>
            
            {/* Custom SVG Responsive Bar Chart */}
            <div className="w-full h-64 mt-2">
              <svg viewBox="0 0 500 240" className="w-full h-full">
                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = 20 + ratio * 160;
                  const value = Math.round(maxAmount * (1 - ratio));
                  return (
                    <g key={index}>
                      <line x1="50" y1={y} x2="480" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      <text x="45" y={y + 4} font-size="9" fill="#94a3b8" textAnchor="end" font-family="monospace">
                        {toBanglaDigits(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {chartData.map((d, index) => {
                  const barWidth = 40;
                  const x = 70 + index * 65;
                  const barHeight = d.amount > 0 ? (d.amount / maxAmount) * 160 : 4;
                  const y = 180 - barHeight;

                  return (
                    <g 
                      key={index}
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="cursor-pointer transition-all duration-300"
                    >
                      {/* Bar Fill */}
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        fill={hoveredBar === index ? '#d4af37' : '#013220'} 
                        rx="4"
                        className="transition-colors duration-200"
                      />
                      {/* Shadow Overlay */}
                      <rect 
                        x={x + 2} 
                        y={y} 
                        width={barWidth - 4} 
                        height={barHeight} 
                        fill="#ffffff" 
                        opacity="0.1" 
                        rx="2"
                      />
                      {/* Hover Tooltip/Value */}
                      {hoveredBar === index && (
                        <g>
                          <rect x={x - 15} y={y - 25} width={70} height={20} fill="#1e293b" rx="4" />
                          <text x={x + 20} y={y - 12} font-size="9" font-weight="bold" fill="#ffffff" textAnchor="middle" font-family="sans-serif">
                            {formatCurrencyBangla(d.amount)}
                          </text>
                        </g>
                      )}
                      
                      {/* Amount above bar on idle */}
                      {hoveredBar !== index && d.amount > 0 && (
                        <text x={x + 20} y={y - 6} font-size="8" font-weight="medium" fill="#013220" textAnchor="middle" font-family="monospace">
                          {toBanglaDigits(Math.round(d.amount / 1000))}k
                        </text>
                      )}

                      {/* X Axis Label */}
                      <text x={x + 20} y="200" font-size="10" fill="#475569" textAnchor="middle" font-weight="medium">
                        {d.monthBangla}
                      </text>
                    </g>
                  );
                })}
                
                {/* Baseline */}
                <line x1="50" y1="180" x2="480" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
          
          <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>অর্থ সংগ্রহের লক্ষ্যমাত্রা: শতভাগ</span>
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <TrendingUp size={14} /> মোট আদায় বৃদ্ধিমান
            </span>
          </div>
        </div>

        {/* Recent Transactions List Panel */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gold rounded-full inline-block"></span>
                সাম্প্রতিক আদায়সমূহ
              </h2>
              <button 
                onClick={() => onSelectTab('ledger')}
                className="text-xs text-emerald-800 hover:underline cursor-pointer"
              >
                সব দেখুন
              </button>
            </div>

            <div className="space-y-3.5">
              {recentPayments.length > 0 ? (
                recentPayments.map((p, index) => (
                  <div 
                    key={index}
                    onClick={() => {
                      onSelectReceipt(p.receiptNo);
                      onSelectTab('receipt');
                    }}
                    className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5 max-w-[70%]">
                      <p className="font-semibold text-sm text-slate-800 truncate group-hover:text-primary">{p.memberName}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{p.receiptNo}</span>
                        <span>•</span>
                        <span>{toBanglaDigits(p.entryDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700 text-sm font-mono">+{formatCurrencyBangla(p.amount)}</p>
                      <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-sans mt-0.5">
                        {p.paymentType === 'Monthly Deposit' ? 'মাসিক সঞ্চয়' : 
                         p.paymentType === 'Registration Fee' ? 'রেজিস্ট্রেশন ফি' : 
                         p.paymentType === 'Meeting Fee' ? 'মিটিং ফি' : p.paymentType}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  কোনো লেনদেনের রেকর্ড নেই।
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4">
            <button 
              onClick={() => onSelectTab('payment')}
              className="w-full py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-semibold shadow-sm transition-all text-center block cursor-pointer"
            >
              নতুন পেমেন্ট এন্ট্রি করুন
            </button>
          </div>
        </div>
      </div>

      {/* Live & Visitor Activity Modal (Admin Only) */}
      {isAdmin && isLiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn no-print">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Activity size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">লাইভ অ্যাপ অ্যাক্টিভিটি & ভিজিটর ট্র্যাকার</h3>
                  <p className="text-xs text-slate-400">রিয়েল-টাইম অনলাইনে থাকা সদস্য এবং আজকের মেম্বার ভিজিট লগ</p>
                </div>
              </div>
              <button
                onClick={() => setIsLiveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-Tabs Switcher */}
            <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setLiveModalTab('live')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    liveModalTab === 'live' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  অনলাইনে আছেন ({toBanglaDigits(currentlyLiveList.length)} জন)
                </button>
                <button
                  onClick={() => setLiveModalTab('today')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    liveModalTab === 'today' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users size={14} />
                  আজকের মোট ভিজিটর ({toBanglaDigits(todayVisitorsList.length)} জন)
                </button>
              </div>

              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block font-mono">
                সিস্টেম সময়: {formatTimeOnly(new Date().toISOString())}
              </span>
            </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto flex-1">
              {liveModalTab === 'live' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                    <span>🟢 <strong>লাইভ মেম্বারদের তালিকা:</strong> নিচে প্রদর্শিত ব্যবহারকারীরা গত ৪৫ সেকেন্ডের মধ্যে অ্যাপ ব্যবহার করেছেন।</span>
                    <span className="font-bold font-mono">মোট অনলাইনে: {toBanglaDigits(currentlyLiveList.length)}</span>
                  </div>

                  {currentlyLiveList.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                            <th className="p-3">ক্রমিক</th>
                            <th className="p-3">ব্যবহারকারী / মেম্বার</th>
                            <th className="p-3">রোল (Role)</th>
                            <th className="p-3">ডিভাইস & ব্রাউজার</th>
                            <th className="p-3 text-right">শেষ সিগন্যাল (Heartbeat)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {currentlyLiveList.map((s, idx) => (
                            <tr key={s.sessionId} className="hover:bg-emerald-50/20">
                              <td className="p-3 font-mono text-slate-400">{toBanglaDigits(idx + 1)}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                                    {(s.memberName || 'U').charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{s.memberName || 'অজানা মেম্বার'}</p>
                                    {s.memberId && <p className="text-[10px] text-slate-500 font-mono">ID: {s.memberId}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                  s.role === 'member' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {s.role === 'admin' ? 'প্রশাসক (Admin)' : s.role === 'member' ? 'সদস্য (Member)' : 'ভিজিটর (Guest)'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 font-mono text-[11px]">
                                {s.deviceInfo || 'Desktop / Mobile'}
                              </td>
                              <td className="p-3 text-right font-mono text-emerald-700 font-bold">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                  {formatRelativeTime(s.lastActive)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <Radio size={32} className="mx-auto text-slate-300 animate-pulse" />
                      <p className="text-sm font-semibold">বর্তমানে কেউ অনলাইনে সক্রিয় নেই</p>
                    </div>
                  )}
                </div>
              )}

              {liveModalTab === 'today' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-center justify-between">
                    <span>📅 <strong>আজকের অ্যাপ ভিজিটর লগ:</strong> আজকে (রাত ১২টা থেকে) অ্যাপে প্রবেশ করা মেম্বার ও ভিজিটরদের তালিকা।</span>
                    <span className="font-bold font-mono">আজকের মোট: {toBanglaDigits(todayVisitorsList.length)}</span>
                  </div>

                  {todayVisitorsList.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                            <th className="p-3">ক্রমিক</th>
                            <th className="p-3">ব্যবহারকারী / মেম্বার</th>
                            <th className="p-3">রোল (Role)</th>
                            <th className="p-3">প্রথম প্রবেশের সময়</th>
                            <th className="p-3">ডিভাইস</th>
                            <th className="p-3 text-right">শেষ কার্যক্রম</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {todayVisitorsList.map((s, idx) => (
                            <tr key={s.sessionId} className="hover:bg-indigo-50/20">
                              <td className="p-3 font-mono text-slate-400">{toBanglaDigits(idx + 1)}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                                    {(s.memberName || 'U').charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{s.memberName || 'অজানা মেম্বার'}</p>
                                    {s.memberId && <p className="text-[10px] text-slate-500 font-mono">ID: {s.memberId}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                                  s.role === 'member' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {s.role === 'admin' ? 'প্রশাসক (Admin)' : s.role === 'member' ? 'সদস্য (Member)' : 'ভিজিটর (Guest)'}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-slate-600">
                                {formatTimeOnly(s.loginTime || s.lastActive)}
                              </td>
                              <td className="p-3 text-slate-600 font-mono text-[11px]">
                                {s.deviceInfo || 'Desktop / Mobile'}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-600">
                                {formatRelativeTime(s.lastActive)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <Users size={32} className="mx-auto text-slate-300" />
                      <p className="text-sm font-semibold">আজকে এখনো কোনো নতুন ভিজিটর এন্ট্রি হয়নি</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck size={14} /> সুরক্ষিত আল-বারাকা রিয়েল-টাইম ট্র্যাকিং ইঞ্জিন
              </span>
              <button
                onClick={() => setIsLiveModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
