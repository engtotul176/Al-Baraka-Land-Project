/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Payment, BankDeposit } from '../types';
import { toBanglaDigits, formatCurrencyBangla, getTodayBanglaDate } from '../utils';
import { Users, Landmark, Wallet, Layers, AlertCircle, ArrowUpRight, TrendingUp, Calendar, BadgeCheck } from 'lucide-react';

interface DashboardSheetProps {
  members: Member[];
  payments: Payment[];
  bankDeposits: BankDeposit[];
  onSelectTab: (tab: string) => void;
  onSelectReceipt: (receiptNo: string) => void;
}

export default function DashboardSheet({
  members,
  payments,
  bankDeposits,
  onSelectTab,
  onSelectReceipt
}: DashboardSheetProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Core metrics calculation
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'Active').length;
  
  const totalCollection = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalBankDeposit = bankDeposits.reduce((sum, b) => sum + b.amount, 0);
  const cashInHand = totalCollection - totalBankDeposit;

  // Current Month Collection (Assuming 2026 as current year, and looking up current real-world month)
  // Let's check what months we have in payments. We can grab the latest payment month or default to "June" 
  const currentMonth = "June"; 
  const currentYear = 2026;
  const currentMonthCollection = payments
    .filter(p => p.month === currentMonth && p.year === currentYear)
    .reduce((sum, p) => sum + p.amount, 0);

  // Due members calculation
  // Let's assume each active member must pay 2000 (Monthly Deposit) for each month up to June.
  // Active members who haven't paid June are due.
  const activePaidJune = new Set(
    payments
      .filter(p => p.month === "June" && p.year === 2026 && p.paymentType === "Monthly Deposit")
      .map(p => p.memberId)
  );
  const dueMembersCount = activeMembers - activePaidJune.size;

  // Last Collection Details
  const sortedPayments = [...payments].sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  const lastPayment = sortedPayments[0];

  // Prepare monthly chart data (Jan to Jun 2026)
  const monthsList = ["January", "February", "March", "April", "May", "June"];
  const monthsBangla: Record<string, string> = {
    "January": "জানুয়ারি",
    "February": "ফেব্রুয়ারি",
    "March": "মার্চ",
    "April": "এপ্রিল",
    "May": "মে",
    "June": "জুন"
  };

  const chartData = monthsList.map(m => {
    const amount = payments
      .filter(p => p.month === m && p.year === 2026)
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
            <p className="text-sm font-medium text-slate-500">ব্যাংক ব্যালেন্স (জমা)</p>
            <p className="text-2xl font-bold text-primary font-mono">{formatCurrencyBangla(totalBankDeposit)}</p>
            <button 
              onClick={() => onSelectTab('bank')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 mt-1 cursor-pointer"
            >
              ব্যাংক রেজিস্টার দেখুন <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="p-3.5 bg-blue-50 rounded-xl text-blue-700 group-hover:scale-110 transition-transform duration-300">
            <Landmark size={24} />
          </div>
        </div>

        {/* Metric 4: Cash in Hand */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-gold transition-all duration-300 flex items-center justify-between group">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">হাতে নগদ তহবিল</p>
            <p className="text-2xl font-bold text-amber-700 font-mono">{formatCurrencyBangla(cashInHand)}</p>
            <p className="text-xs text-slate-400">তহবিল মাইনাস ব্যাংক ডিপোজিট</p>
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
    </div>
  );
}
