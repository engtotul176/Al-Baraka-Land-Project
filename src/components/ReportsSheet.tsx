/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member, Payment, SystemSettings } from '../types';
import { toBanglaDigits, formatCurrencyBangla } from '../utils';
import { FileChartLine, Calendar, Award, AlertTriangle, Printer, ArrowRight, Eye, Edit2, Trash2 } from 'lucide-react';
import EditPaymentModal from './EditPaymentModal';

interface ReportsSheetProps {
  members: Member[];
  payments: Payment[];
  settings: SystemSettings;
  onSelectTab: (tab: string) => void;
  onSelectReceipt: (receiptNo: string) => void;
  onSelectMemberLedger: (memberId: string) => void;
  isAdmin?: boolean;
  onDeletePayment?: (receiptNo: string) => void;
  onUpdatePayment?: (payment: Payment) => void;
}

const MONTHS_LIST = [
  { name: "January", bangla: "জানুয়ারি" },
  { name: "February", bangla: "ফেব্রুয়ারি" },
  { name: "March", bangla: "মার্চ" },
  { name: "April", bangla: "এপ্রিল" },
  { name: "May", bangla: "মে" },
  { name: "June", bangla: "জুন" },
  { name: "July", bangla: "জুলাই" },
  { name: "August", bangla: "আগস্ট" },
  { name: "September", bangla: "সেপ্টেম্বর" },
  { name: "October", bangla: "অক্টোবর" },
  { name: "November", bangla: "নভেম্বর" },
  { name: "December", bangla: "ডিসেম্বর" }
];

export default function ReportsSheet({
  members,
  payments,
  settings,
  onSelectTab,
  onSelectReceipt,
  onSelectMemberLedger,
  isAdmin = true,
  onDeletePayment,
  onUpdatePayment
}: ReportsSheetProps) {
  const [reportSubTab, setReportSubTab] = useState<'monthly' | 'yearly' | 'dues'>('monthly');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPaymentToEdit, setSelectedPaymentToEdit] = useState<Payment | null>(null);

  // Filter States
  const now = new Date();
  const currentRealMonth = MONTHS_LIST[now.getMonth()]?.name || 'July';
  const [selectedMonth, setSelectedMonth] = useState(currentRealMonth);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [dueReportMonth, setDueReportMonth] = useState(currentRealMonth);

  // PRINT CURRENT ACTIVE REPORT
  const handlePrint = () => {
    window.print();
  };

  // --- 1. MONTHLY REPORT CALCULATIONS ---
  const monthlyPayments = payments.filter(p => p.month === selectedMonth && p.year === selectedYear);
  const monthlyTotal = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

  const monthlyTypeBreakdown = monthlyPayments.reduce((acc, p) => {
    acc[p.paymentType] = (acc[p.paymentType] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  // --- 2. YEARLY REPORT CALCULATIONS ---
  const yearlyPayments = payments.filter(p => p.year === selectedYear);
  const yearlyTotal = yearlyPayments.reduce((sum, p) => sum + p.amount, 0);

  // Monthly sums in the year
  const yearlyMonthlySums = MONTHS_LIST.map(m => {
    const amount = yearlyPayments.filter(p => p.month === m.name).reduce((sum, p) => sum + p.amount, 0);
    return { name: m.name, bangla: m.bangla, amount };
  });

  const yearlyTypeBreakdown = yearlyPayments.reduce((acc, p) => {
    acc[p.paymentType] = (acc[p.paymentType] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  // --- 3. DUE REPORT CALCULATIONS ---
  // List active members who have NOT paid 'Monthly Deposit' for the chosen `dueReportMonth`
  const activeMembers = members.filter(m => m.status === 'Active');
  const paidMembersForMonth = new Set(
    payments
      .filter(p => p.month === dueReportMonth && p.year === selectedYear && p.paymentType === 'Monthly Deposit')
      .map(p => p.memberId)
  );

  const dueMembersList = activeMembers.filter(m => !paidMembersForMonth.has(m.memberId));

  return (
    <div className="space-y-6">
      {/* Page Title & Report Nested Sub Tabs */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <FileChartLine className="text-gold" />
            স্বয়ংক্রিয় আর্থিক বিবরণী ও রিপোর্ট (Reports Sheet)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            তহবিলের মাস-ভিত্তিক, বছর-ভিত্তিক এবং বকেয়া সদস্যদের তালিকা স্বয়ংক্রিয়ভাবে লোড করুন।
          </p>
        </div>

        {/* Nested Sub Tabs Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setReportSubTab('monthly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              reportSubTab === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            মাসিক রিপোর্ট
          </button>
          <button
            onClick={() => setReportSubTab('yearly')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              reportSubTab === 'yearly' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            বার্ষিক রিপোর্ট
          </button>
          <button
            onClick={() => setReportSubTab('dues')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              reportSubTab === 'dues' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            বকেয়া রিপোর্ট
          </button>
        </div>
      </div>

      {/* --- REPORT SECTION VIEW --- */}

      {/* Sub-Tab 1: Monthly Report */}
      {reportSubTab === 'monthly' && (
        <div className="space-y-6">
          {/* Filter Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">মাস ও বছর নির্বাচন করুন:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              >
                {MONTHS_LIST.map(m => (
                  <option key={m.name} value={m.name}>{m.bangla}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono"
              >
                {[2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{toBanglaDigits(y)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer size={14} /> প্রিন্ট মাসিক স্লিপ
            </button>
          </div>

          {/* Printable Report Sheet */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6 print-shadow-none">
            {/* Header in Print */}
            <div className="text-center pb-4 border-b-2 border-gold">
              <h2 className="text-xl sm:text-2xl font-bold text-primary">{settings.orgName}</h2>
              <p className="text-xs text-gold font-semibold">{settings.orgSlogan}</p>
              <h3 className="text-sm font-bold text-slate-800 mt-2">
                মাসিক হিসাব বিবরণী রিপোর্ট: {MONTHS_LIST.find(m => m.name === selectedMonth)?.bangla} - {toBanglaDigits(selectedYear)}
              </h3>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">চলতি মাসে মোট আদায়</span>
                <span className="text-2xl font-bold text-primary font-mono block mt-1">{formatCurrencyBangla(monthlyTotal)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">লেনদেন আদায় সংখ্যা</span>
                <span className="text-2xl font-bold text-emerald-800 font-mono block mt-1">{toBanglaDigits(monthlyPayments.length)} টি</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">সদস্য জমা হার</span>
                <span className="text-2xl font-bold text-amber-700 font-mono block mt-1">
                  {toBanglaDigits(Math.round((monthlyPayments.filter(p => p.paymentType === 'Monthly Deposit').length / members.length) * 100))}%
                </span>
              </div>
            </div>

            {/* Breakdown by Account Headings */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Calendar size={16} /> খাত-ভিত্তিক প্রাপ্তির বিবরণী
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                {['Registration Fee', 'Monthly Deposit', 'Meeting Fee', 'Fine', 'Donation', 'Other'].map(type => {
                  const label = type === 'Monthly Deposit' ? 'মাসিক সঞ্চয়' : 
                                type === 'Registration Fee' ? 'রেজিস্ট্রেশন ফি' : 
                                type === 'Meeting Fee' ? 'মিটিং ফি' : 
                                type === 'Fine' ? 'বিলম্ব জরিমানা' : type;
                  const amt = monthlyTypeBreakdown[type] || 0;
                  return (
                    <div key={type} className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl text-center">
                      <span className="text-slate-400 font-medium">{label}:</span>
                      <span className="block font-bold text-slate-800 font-mono mt-1">{formatCurrencyBangla(amt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List of Transactions */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Award size={16} /> আদায়কৃত রশিদের বিস্তারিত তালিকা
              </h4>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                      <th className="p-3">রশিদ নং</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">সদস্য আইডি</th>
                      <th className="p-3">সদস্যের নাম</th>
                      <th className="p-3">খাত</th>
                      <th className="p-3 text-right">পরিমাণ</th>
                      <th className="p-3 no-print text-center">রশিদ</th>
                      {isAdmin && <th className="p-3 no-print text-center">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                    {monthlyPayments.length > 0 ? (
                      monthlyPayments.map(p => (
                        <tr key={p.receiptNo} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold font-mono text-primary">{p.receiptNo}</td>
                          <td className="p-3 font-mono">{toBanglaDigits(p.entryDate)}</td>
                          <td className="p-3 font-mono font-bold text-slate-600">{p.memberId}</td>
                          <td className="p-3 font-semibold text-slate-900">{p.memberName}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {p.paymentType === 'Monthly Deposit' ? 'মাসিক সঞ্চয়' : p.paymentType}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-800">{formatCurrencyBangla(p.amount)}</td>
                          <td className="p-3 text-center no-print">
                            <button
                              onClick={() => {
                                onSelectReceipt(p.receiptNo);
                                onSelectTab('receipt');
                              }}
                              className="text-[10px] text-emerald-800 hover:underline flex items-center justify-center gap-0.5 mx-auto cursor-pointer"
                            >
                              রশিদ দেখুন <ArrowRight size={12} />
                            </button>
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-center no-print flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedPaymentToEdit(p);
                                  setIsEditModalOpen(true);
                                }}
                                title="সম্পাদনা করুন"
                                className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  if (onDeletePayment) {
                                    const confirm = window.confirm(`আপনি কি নিশ্চিতভাবে এই রশিদটি (রশিদ নং: ${p.receiptNo}, পরিমাণ: ${formatCurrencyBangla(p.amount)}) মুছে ফেলতে চান?`);
                                    if (confirm) {
                                      onDeletePayment(p.receiptNo);
                                    }
                                  }
                                }}
                                title="মুছে ফেলুন"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-slate-400">
                          এই মাসে কোনো পেমেন্ট পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Yearly Report */}
      {reportSubTab === 'yearly' && (
        <div className="space-y-6">
          {/* Filter Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">বছর নির্বাচন করুন:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold text-primary"
              >
                {[2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{toBanglaDigits(y)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer size={14} /> বার্ষিক রিপোর্ট প্রিন্ট করুন
            </button>
          </div>

          {/* Printable Report */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6 print-shadow-none">
            <div className="text-center pb-4 border-b-2 border-gold">
              <h2 className="text-xl sm:text-2xl font-bold text-primary">{settings.orgName}</h2>
              <p className="text-xs text-gold font-semibold">{settings.orgSlogan}</p>
              <h3 className="text-sm font-bold text-slate-800 mt-2">
                বার্ষিক আর্থিক হিসাব বিবরণী খতিয়ান: {toBanglaDigits(selectedYear)}
              </h3>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">বছরের সর্বমোট সংগ্রহ</span>
                <span className="text-xl font-bold text-primary font-mono block mt-1">{formatCurrencyBangla(yearlyTotal)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">মাসিক সঞ্চয় খাত (সঞ্চয়)</span>
                <span className="text-xl font-bold text-emerald-800 font-mono block mt-1">{formatCurrencyBangla(yearlyTypeBreakdown['Monthly Deposit'] || 0)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">ভর্তি ও রেজিস্ট্রেশন ফান্ড</span>
                <span className="text-xl font-bold text-blue-800 font-mono block mt-1">{formatCurrencyBangla(yearlyTypeBreakdown['Registration Fee'] || 0)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">অন্যান্য ফি ও বিলম্ব জরিমানা</span>
                <span className="text-xl font-bold text-amber-700 font-mono block mt-1">
                  {formatCurrencyBangla((yearlyTypeBreakdown['Meeting Fee'] || 0) + (yearlyTypeBreakdown['Fine'] || 0) + (yearlyTypeBreakdown['Donation'] || 0) + (yearlyTypeBreakdown['Other'] || 0))}
                </span>
              </div>
            </div>

            {/* Month-wise Yearly table */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Calendar size={16} /> প্রতি মাসের সঞ্চয় সংগ্রহের সমষ্টি তালিকা
              </h4>
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
                      <th className="p-3">ক্রমিক</th>
                      <th className="p-3">মাস</th>
                      <th className="p-3 text-right">আদায়ের পরিমাণ</th>
                      <th className="p-3 text-center">শতকরা হিসাব (%)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 text-slate-700 font-medium">
                    {yearlyMonthlySums.map((m, index) => {
                      const percentage = yearlyTotal > 0 ? Math.round((m.amount / yearlyTotal) * 100) : 0;
                      return (
                        <tr key={m.name} className="hover:bg-slate-50">
                          <td className="p-3 font-mono">{toBanglaDigits(index + 1)}</td>
                          <td className="p-3 font-bold text-slate-800">{m.bangla}</td>
                          <td className="p-3 text-right font-mono font-bold text-primary">{formatCurrencyBangla(m.amount)}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono text-xs w-8 text-right">{toBanglaDigits(percentage)}%</span>
                              <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block">
                                <div className="bg-gold h-full" style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100 font-bold text-primary text-xs">
                      <td colSpan={2} className="p-3 text-right text-slate-500">সর্বমোট বার্ষিক জমা:</td>
                      <td className="p-3 text-right font-mono text-sm">{formatCurrencyBangla(yearlyTotal)}</td>
                      <td className="p-3 text-center font-mono">১০০%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Due Report */}
      {reportSubTab === 'dues' && (
        <div className="space-y-6">
          {/* Filter Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">কোন মাসের বকেয়া খুঁজবেন?</span>
              <select
                value={dueReportMonth}
                onChange={(e) => setDueReportMonth(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-bold text-primary"
              >
                {MONTHS_LIST.map(m => (
                  <option key={m.name} value={m.name}>{m.bangla}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer size={14} /> বকেয়া রিপোর্ট প্রিন্ট
            </button>
          </div>

          {/* Printable Report */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6 print-shadow-none">
            <div className="text-center pb-4 border-b-2 border-gold">
              <h2 className="text-xl sm:text-2xl font-bold text-primary">{settings.orgName}</h2>
              <p className="text-xs text-gold font-semibold">{settings.orgSlogan}</p>
              <h3 className="text-sm font-bold text-rose-700 mt-2 flex items-center justify-center gap-1">
                <AlertTriangle size={16} />
                বকেয়া মাসিক সঞ্চয়কারী সদস্য রিপোর্ট: {MONTHS_LIST.find(m => m.name === dueReportMonth)?.bangla} - {toBanglaDigits(selectedYear)}
              </h3>
            </div>

            {/* Quick alert */}
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-xs text-rose-700 no-print">
              <span><strong>সতর্কতা:</strong> নিচের সদস্যদের এই নির্দিষ্ট মাসে মাসিক সঞ্চয় তহবিল (২০১৬ ৳) এন্ট্রি পাওয়া যায়নি। অনুগ্রহ করে তাদের সাথে যোগাযোগ করুন।</span>
              <span className="font-bold">মোট অনাদায়ী সদস্য: {toBanglaDigits(dueMembersList.length)} জন</span>
            </div>

            {/* List of Due Members */}
            <div className="space-y-3">
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-rose-50 text-rose-800 text-xs font-bold border-b border-rose-100">
                      <th className="p-3 w-16 text-center">ক্রমিক</th>
                      <th className="p-3 w-28 text-center">সদস্য আইডি</th>
                      <th className="p-3">সদস্যের নাম</th>
                      <th className="p-3">মোবাইল নম্বর</th>
                      <th className="p-3">পেশা</th>
                      <th className="p-3 text-right">মাসিক বকেয়া কিস্তি</th>
                      <th className="p-3 text-center no-print">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 text-slate-700 font-medium">
                    {dueMembersList.length > 0 ? (
                      dueMembersList.map((m, index) => (
                        <tr key={m.memberId} className="hover:bg-rose-50/20">
                          <td className="p-3 text-center font-mono">{toBanglaDigits(index + 1)}</td>
                          <td className="p-3 text-center font-bold font-mono text-primary">{m.memberId}</td>
                          <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                          <td className="p-3 font-mono">{toBanglaDigits(m.mobile)}</td>
                          <td className="p-3">{m.profession || '―'}</td>
                          <td className="p-3 text-right font-mono font-bold text-rose-600">{formatCurrencyBangla(settings.monthlyAmount)}</td>
                          <td className="p-3 text-center no-print">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  onSelectMemberLedger(m.memberId);
                                  onSelectTab('ledger');
                                }}
                                className="text-[10px] text-emerald-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                              >
                                খতিয়ান দেখুন
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-emerald-700 bg-emerald-50/50">
                          সব সদস্যের টাকা আদায় সম্পন্ন হয়েছে! কোনো বকেয়া সদস্য নেই।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {isEditModalOpen && selectedPaymentToEdit && (
        <EditPaymentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPaymentToEdit(null);
          }}
          payment={selectedPaymentToEdit}
          members={members}
          onSave={(updated) => {
            if (onUpdatePayment) {
              onUpdatePayment(updated);
              alert("পেমেন্ট সফলভাবে সংশোধন করা হয়েছে!");
            }
          }}
        />
      )}
    </div>
  );
}
