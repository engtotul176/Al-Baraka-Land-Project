/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Member, Payment, SystemSettings } from '../types';
import { toBanglaDigits, formatCurrencyBangla } from '../utils';
import { FileText, Printer, CheckCircle, AlertTriangle, Landmark, Compass, Eye } from 'lucide-react';

interface MemberLedgerSheetProps {
  members: Member[];
  payments: Payment[];
  settings: SystemSettings;
  selectedMemberId: string;
  onSelectMemberId: (memberId: string) => void;
  onSelectTab: (tab: string) => void;
  onSelectReceipt: (receiptNo: string) => void;
  isLockedToMember?: boolean;
}

export default function MemberLedgerSheet({
  members,
  payments,
  settings,
  selectedMemberId,
  onSelectMemberId,
  onSelectTab,
  onSelectReceipt,
  isLockedToMember = false
}: MemberLedgerSheetProps) {
  
  // Active member object
  const activeMember = members.find(m => m.memberId === selectedMemberId) || null;

  // Payments corresponding to this member
  const memberPayments = activeMember
    ? payments.filter(p => p.memberId === activeMember.memberId)
    : [];

  // Aggregated totals by payment types
  const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0);

  const registrationFeeTotal = memberPayments
    .filter(p => p.paymentType === 'Registration Fee')
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyDepositTotal = memberPayments
    .filter(p => p.paymentType === 'Monthly Deposit')
    .reduce((sum, p) => sum + p.amount, 0);

  const meetingFeeTotal = memberPayments
    .filter(p => p.paymentType === 'Meeting Fee')
    .reduce((sum, p) => sum + p.amount, 0);

  const fineTotal = memberPayments
    .filter(p => p.paymentType === 'Fine')
    .reduce((sum, p) => sum + p.amount, 0);

  const donationTotal = memberPayments
    .filter(p => p.paymentType === 'Donation')
    .reduce((sum, p) => sum + p.amount, 0);

  const otherTotal = memberPayments
    .filter(p => p.paymentType === 'Other')
    .reduce((sum, p) => sum + p.amount, 0);

  // Calculation of dues
  // Baseline: expected monthly deposit for elapsed active months in 2026 (Jan to Jun = 6 months)
  const elapsedMonths = 6;
  const expectedMonthlyDeposit = elapsedMonths * settings.monthlyAmount;
  const monthlyDepositDue = Math.max(0, expectedMonthlyDeposit - monthlyDepositTotal);

  // Print ledger handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Selector and Action Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <FileText className="text-gold" />
            সদস্য ব্যক্তিগত লেজার খতিয়ান (Member Ledger)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            সদস্য নির্বাচন করে তার জমা ইতিহাস, সর্বমোট পরিশোধিত ও বকেয়া টাকার পরিমাণ ও খতিয়ান স্লিপ প্রিন্ট করুন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">সদস্য সিলেক্ট করুন:</label>
          {isLockedToMember ? (
            <span className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold rounded-xl flex items-center gap-1">
              🔒 আপনার ব্যক্তিগত লেজার ({selectedMemberId})
            </span>
          ) : (
            <select
              value={selectedMemberId}
              onChange={(e) => onSelectMemberId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white font-medium text-slate-800"
            >
              <option value="">-- সদস্য সিলেক্ট করুন --</option>
              {members.map(m => (
                <option key={m.memberId} value={m.memberId}>
                  {m.name} ({m.memberId})
                </option>
              ))}
            </select>
          )}

          {activeMember && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer size={14} />
              লেজার প্রিন্ট / PDF
            </button>
          )}
        </div>
      </div>

      {activeMember ? (
        <div className="space-y-6 print-shadow-none">
          {/* Printable Individual Ledger Cover */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6 print-shadow-none">
            {/* Print Specific Header */}
            <div className="hidden print:block text-center border-b-2 border-gold pb-4 mb-6">
              <h1 className="text-2xl font-bold text-primary">{settings.orgName}</h1>
              <p className="text-xs text-gold font-semibold">{settings.orgSlogan}</p>
              <p className="text-[10px] text-slate-500 mt-1">সদস্যের ব্যক্তিগত হিসাব বিবরণী (লেজার খতিয়ান)</p>
            </div>

            {/* General Member Information Card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-gold overflow-hidden bg-slate-50 flex-shrink-0">
                  <img 
                    src={activeMember.photo || settings.founderPhoto} 
                    alt={activeMember.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                    {activeMember.name}
                    <span className="font-mono text-xs bg-emerald-50 text-primary border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      আইডি: {activeMember.memberId}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-1 text-xs text-slate-500">
                    <p>পিতা: <span className="font-semibold text-slate-700">{activeMember.fatherName}</span></p>
                    <p>মোবাইল: <span className="font-semibold text-slate-700 font-mono">{toBanglaDigits(activeMember.mobile)}</span></p>
                    <p>পেশা: <span className="font-semibold text-slate-700">{activeMember.profession || '―'}</span></p>
                    <p>যোগদান: <span className="font-semibold text-slate-700 font-mono">{toBanglaDigits(activeMember.joiningDate)}</span></p>
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">সদস্য স্ট্যাটাস</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                    activeMember.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {activeMember.status === 'Active' ? 'সক্রিয় সদস্য' : 'নিষ্ক্রিয় সদস্য'}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Summary Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">মোট পরিশোধিত ফান্ড (টাকা)</span>
                <span className="text-xl font-bold text-primary font-mono block mt-1">{formatCurrencyBangla(totalPaid)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">মাসিক সঞ্চয় জমা (টাকা)</span>
                <span className="text-xl font-bold text-emerald-800 font-mono block mt-1">{formatCurrencyBangla(monthlyDepositTotal)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">বকেয়া মাসিক সঞ্চয় (Dues)</span>
                <span className={`text-xl font-bold font-mono block mt-1 ${monthlyDepositDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatCurrencyBangla(monthlyDepositDue)}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">মোট ফি ও অন্যান্য আদায়</span>
                <span className="text-xl font-bold text-amber-700 font-mono block mt-1">
                  {formatCurrencyBangla(registrationFeeTotal + meetingFeeTotal + fineTotal + donationTotal + otherTotal)}
                </span>
              </div>
            </div>

            {/* Ledger Itemization breakdown */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Landmark size={16} />
                লেনদেন খতিয়ানের খাতভিত্তিক বিবরণী
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
                  <span className="text-slate-400">রেজিস্ট্রেশন ফি:</span>
                  <span className="block font-bold text-slate-800 font-mono mt-1">{formatCurrencyBangla(registrationFeeTotal)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
                  <span className="text-slate-400">মাসিক সঞ্চয়:</span>
                  <span className="block font-bold text-emerald-700 font-mono mt-1">{formatCurrencyBangla(monthlyDepositTotal)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
                  <span className="text-slate-400">মাসিক সভা ফি:</span>
                  <span className="block font-bold text-slate-800 font-mono mt-1">{formatCurrencyBangla(meetingFeeTotal)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
                  <span className="text-slate-400">বিলম্ব জরিমানা (Fine):</span>
                  <span className="block font-bold text-slate-800 font-mono mt-1">{formatCurrencyBangla(fineTotal)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
                  <span className="text-slate-400">প্রকল্প অনুদান:</span>
                  <span className="block font-bold text-slate-800 font-mono mt-1">{formatCurrencyBangla(donationTotal)}</span>
                </div>
                <div className="p-3 bg-white border border-slate-100 rounded-lg text-center">
                  <span className="text-slate-400">অন্যান্য ফান্ড:</span>
                  <span className="block font-bold text-slate-800 font-mono mt-1">{formatCurrencyBangla(otherTotal)}</span>
                </div>
              </div>
            </div>

            {/* Complete Transaction History Table */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-sm text-primary flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Compass size={16} />
                সকল লেনদেনের তারিখভিত্তিক ইতিহাস
              </h4>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-100">
                      <th className="p-3">রশিদ নম্বর</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">প্রাপ্তির খাত</th>
                      <th className="p-3 text-right">পরিমাণ</th>
                      <th className="p-3">হিসাব মাস</th>
                      <th className="p-3">মন্তব্য</th>
                      <th className="p-3 text-center no-print">রশিদ</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                    {memberPayments.length > 0 ? (
                      [...memberPayments].reverse().map((p) => (
                        <tr key={p.receiptNo} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold font-mono text-primary">{p.receiptNo}</td>
                          <td className="p-3 font-mono">{toBanglaDigits(p.entryDate)}</td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {p.paymentType === 'Monthly Deposit' ? 'মাসিক সঞ্চয়' : 
                               p.paymentType === 'Registration Fee' ? 'রেজিস্ট্রেশন ফি' : 
                               p.paymentType === 'Meeting Fee' ? 'মিটিং ফি' : 
                               p.paymentType === 'Fine' ? 'বিলম্ব জরিমানা' : p.paymentType}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-800">{formatCurrencyBangla(p.amount)}</td>
                          <td className="p-3">{p.month} - {toBanglaDigits(p.year)}</td>
                          <td className="p-3 text-slate-500">{p.remarks || '―'}</td>
                          <td className="p-3 text-center no-print">
                            <button
                              onClick={() => {
                                onSelectReceipt(p.receiptNo);
                                onSelectTab('receipt');
                              }}
                              className="text-[10px] text-emerald-800 hover:underline flex items-center justify-center gap-0.5 mx-auto cursor-pointer"
                            >
                              <Eye size={12} /> রশিদে যান
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Stamp footer in print */}
            <div className="hidden print:flex justify-between items-end mt-12 text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-4">
              <span>আল-বারাকা ট্রাস্ট খতিয়ান স্লিপ</span>
              <span>আদায়কারী: {settings.founderName}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-sm">
          খতিয়ান দেখার জন্য অনুগ্রহ করে উপর থেকে কোনো একজন সদস্য সিলেক্ট করুন।
        </div>
      )}
    </div>
  );
}
