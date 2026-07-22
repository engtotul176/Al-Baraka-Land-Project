/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, Payment, PaymentType, SystemSettings } from '../types';
import { toBanglaDigits, formatCurrencyBangla, generateNextReceiptNo } from '../utils';
import { BadgeCheck, Receipt, AlertTriangle, ArrowRight, CornerDownRight, CheckCircle2 } from 'lucide-react';

interface PaymentEntrySheetProps {
  members: Member[];
  payments: Payment[];
  settings: SystemSettings;
  onAddPayment: (payment: Payment) => void;
  onSelectTab: (tab: string) => void;
  onSelectReceipt: (receiptNo: string) => void;
  isAdmin?: boolean;
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

export default function PaymentEntrySheet({
  members,
  payments,
  settings,
  onAddPayment,
  onSelectTab,
  onSelectReceipt,
  isAdmin = true
}: PaymentEntrySheetProps) {
  const now = new Date();
  const currentRealMonth = MONTHS_LIST[now.getMonth()]?.name || 'July';

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(currentRealMonth);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>('Monthly Deposit');
  const [amount, setAmount] = useState(settings.monthlyAmount);
  const [remarks, setRemarks] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNo, setReceiptNo] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Computed fields for selected member
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [previousDue, setPreviousDue] = useState(0);

  // Auto-fill values and calculations when member or payment type changes
  useEffect(() => {
    const member = members.find(m => m.memberId === selectedMemberId) || null;
    setSelectedMember(member);

    if (member) {
      // Calculate member metrics
      const memberPayments = payments.filter(p => p.memberId === member.memberId);
      
      // Total Paid (Grand total)
      const total = memberPayments.reduce((sum, p) => sum + p.amount, 0);
      setTotalPaid(total);

      // Monthly Deposits Paid
      const monthlyDepositsPaid = memberPayments
        .filter(p => p.paymentType === 'Monthly Deposit')
        .reduce((sum, p) => sum + p.amount, 0);

      // Calculate dues based on active months up to current month in current year
      const elapsedMonthsCount = now.getMonth() + 1; 
      const totalExpectedMonthlyDeposit = elapsedMonthsCount * settings.monthlyAmount;
      const due = Math.max(0, totalExpectedMonthlyDeposit - monthlyDepositsPaid);
      setPreviousDue(due);
    } else {
      setTotalPaid(0);
      setPreviousDue(0);
    }
  }, [selectedMemberId, members, payments, settings]);

  // Handle amount auto-fill depending on type
  useEffect(() => {
    switch (selectedPaymentType) {
      case 'Monthly Deposit':
        setAmount(settings.monthlyAmount);
        setRemarks("মাসিক সঞ্চয় জমা");
        break;
      case 'Registration Fee':
        setAmount(settings.registrationFee);
        setRemarks("নতুন সদস্য রেজিস্ট্রেশন ফি");
        break;
      case 'Meeting Fee':
        setAmount(settings.meetingFee);
        setRemarks("সাধারণ সভা ফি");
        break;
      case 'Fine':
        setAmount(settings.fine);
        setRemarks("বিলম্ব জরিমানা");
        break;
      case 'Donation':
        setAmount(5000);
        setRemarks("প্রকল্প উন্নয়ন অনুদান");
        break;
      case 'Other':
        setAmount(500);
        setRemarks("অন্যান্য খাত");
        break;
    }
  }, [selectedPaymentType, settings]);

  // Receipt auto generation on Year change or payment change
  useEffect(() => {
    const nextReceipt = generateNextReceiptNo(payments, selectedYear);
    setReceiptNo(nextReceipt);
  }, [payments, selectedYear]);

  // Check for duplicate payment warning
  useEffect(() => {
    if (!selectedMemberId) {
      setIsDuplicate(false);
      return;
    }
    const match = payments.some(p => 
      p.memberId === selectedMemberId &&
      p.paymentType === selectedPaymentType &&
      p.month === selectedMonth &&
      p.year === selectedYear
    );
    setIsDuplicate(match);
  }, [selectedMemberId, selectedPaymentType, selectedMonth, selectedYear, payments]);

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert("সদস্য নির্বাচন করুন!");
      return;
    }
    if (!amount || amount <= 0) {
      alert("জমার পরিমাণ সঠিক হতে হবে!");
      return;
    }

    const payload: Payment = {
      receiptNo,
      memberId: selectedMemberId,
      memberName: selectedMember ? selectedMember.name : '',
      month: selectedMonth,
      year: selectedYear,
      paymentType: selectedPaymentType,
      amount: Number(amount),
      entryDate,
      remarks: remarks.trim()
    };

    onAddPayment(payload);
    
    // Auto trigger success and view receipt
    onSelectReceipt(receiptNo);
    alert(`পেমেন্ট সফলভাবে এন্ট্রি করা হয়েছে!\nরশিদ নং: ${receiptNo}\n\nএখন রশিদটি প্রিন্ট বা শেয়ার করতে পারবেন।`);
    onSelectTab('receipt');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Receipt className="text-gold" />
            পেমেন্ট আদায় এন্ট্রি (Payment Entry Form)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            সদস্যদের কাছ থেকে বিভিন্ন তহবিলে প্রাপ্ত নগদ বা ব্যাংক জমা এখানে এন্ট্রি করুন।
          </p>
        </div>
        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
          রশিদ নম্বর: <span className="font-bold text-primary">{receiptNo}</span>
        </span>
      </div>

      {/* Main Form and Member Preview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          {isAdmin ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form Section Header */}
              <div className="border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                <h3 className="font-bold text-sm text-primary">লেনদেন বিবরণী ফরম</h3>
                {isDuplicate && (
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                    <AlertTriangle size={13} />
                    ইতিমধ্যে পরিশোধিত! (ডুপ্লিকেট পেমেন্ট সতর্কতা)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Member Selection Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">সদস্য নির্বাচন করুন*</label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white font-medium"
                    required
                  >
                    <option value="">-- সদস্য সিলেক্ট করুন --</option>
                    {members.map(m => (
                      <option key={m.memberId} value={m.memberId}>
                        {m.name} ({m.memberId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">প্রাপ্তির খাত (Payment Type)*</label>
                  <select
                    value={selectedPaymentType}
                    onChange={(e) => setSelectedPaymentType(e.target.value as PaymentType)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white font-medium"
                    required
                  >
                    <option value="Monthly Deposit">মাসিক সঞ্চয় (Monthly Deposit)</option>
                    <option value="Registration Fee">রেজিস্ট্রেশন ফি (Registration Fee)</option>
                    <option value="Meeting Fee">মিটিং ফি (Meeting Fee)</option>
                    <option value="Fine">জরিমানা (Fine)</option>
                    <option value="Donation">অনুদান (Donation)</option>
                    <option value="Other">অন্যান্য (Other)</option>
                  </select>
                </div>

                {/* Month Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পরিশোধের মাস*</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white"
                    required
                  >
                    {MONTHS_LIST.map(m => (
                      <option key={m.name} value={m.name}>{m.bangla} ({m.name})</option>
                    ))}
                  </select>
                </div>

                {/* Year Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পরিশোধের বছর*</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white font-mono"
                    required
                  >
                    {[2026, 2027, 2028, 2029, 2030].map(y => (
                      <option key={y} value={y}>{toBanglaDigits(y)}</option>
                    ))}
                  </select>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">টাকার পরিমাণ (Amount)*</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full pl-3 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold text-slate-800"
                      min="1"
                      required
                    />
                    <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-xs">৳</span>
                  </div>
                </div>

                {/* Entry Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">জমার তারিখ (Entry Date)*</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
              </div>

              {/* Remarks Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">মন্তব্য (Remarks)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="যেমন: জানুয়ারি মাসের মাসিক সঞ্চয় বাবদ"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
                {isDuplicate && (
                  <span className="text-xs text-rose-600 font-bold flex items-center gap-1 mr-auto bg-rose-50 px-2 py-1 rounded border border-rose-100">
                    <AlertTriangle size={14} /> সতর্ক হোন: এই পরিশোধটি অলরেডি রয়েছে!
                  </span>
                )}
                
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 hover:scale-[1.01] cursor-pointer"
                >
                  <BadgeCheck size={16} />
                  লেনদেন সফল করুন এবং রশিদ জেনারেট করুন
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-slate-200 rounded-3xl space-y-4 bg-slate-50/50">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200 text-amber-500 shadow-sm">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1.5 max-w-md">
                <h4 className="text-sm font-bold text-slate-800">🔒 রিড-অনলি মোড (মেম্বার ভিউ)</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  আপনি বর্তমানে <strong>মেম্বার ভিউ বা রিড-অনলি</strong> মোডে আছেন। নতুন পেমেন্ট আদায় এন্ট্রি করতে হলে দয়া করে উপরের মেনু থেকে <strong>এডমিন পিন (Admin PIN)</strong> দিয়ে এডমিন মোড আনলক করুন।
                </p>
              </div>
              
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 font-medium font-sans">
                  অন্যান্য সদস্যরা শুধুমাত্র ড্যাশবোর্ড ও খতিয়ান দেখতে পারবেন।
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Selected Member Details Dashboard Preview (Column Right) */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary border-b border-slate-200 pb-2 mb-4 flex items-center gap-1.5">
              <CornerDownRight size={16} />
              সদস্য প্রোফাইল ও ব্যালেন্স স্থিতি
            </h3>

            {selectedMember ? (
              <div className="space-y-4 animate-fade-in">
                {/* Photo and general */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full border-2 border-gold overflow-hidden bg-slate-200 flex-shrink-0">
                    <img 
                      src={selectedMember.photo || settings.founderPhoto} 
                      alt={selectedMember.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 leading-tight">{selectedMember.name}</h4>
                    <span className="inline-block text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-bold mt-1">
                      আইডি: {selectedMember.memberId}
                    </span>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{toBanglaDigits(selectedMember.mobile)}</p>
                  </div>
                </div>

                {/* Balance Metrics Cards */}
                <div className="space-y-3 pt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">মোট জমাকৃত ফান্ড</p>
                      <p className="text-lg font-bold text-primary font-mono mt-0.5">{formatCurrencyBangla(totalPaid)}</p>
                    </div>
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">বকেয়া মাসিক সঞ্চয় (Dues)</p>
                      <p className={`text-lg font-bold font-mono mt-0.5 ${previousDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {formatCurrencyBangla(previousDue)}
                      </p>
                    </div>
                    <AlertTriangle size={20} className={previousDue > 0 ? 'text-rose-500' : 'text-emerald-600'} />
                  </div>
                </div>

                {/* Sub details list */}
                <div className="text-xs space-y-2 border-t border-slate-200 pt-3 text-slate-600">
                  <div className="flex justify-between">
                    <span>পেশা:</span>
                    <span className="font-bold">{selectedMember.profession || '―'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>মনোনীত ব্যক্তি (নমিনি):</span>
                    <span className="font-bold text-slate-700">{selectedMember.nominee || '―'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>যোগদানের তারিখ:</span>
                    <span className="font-bold font-mono">{toBanglaDigits(selectedMember.joiningDate)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <p className="text-xs">ডাটা দেখার জন্য বামদিকের ফরম থেকে কোনো একজন সদস্য সিলেক্ট করুন।</p>
              </div>
            )}
          </div>

          {/* Quick Guidance footer */}
          <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 text-[11px] text-emerald-800 leading-normal">
            <strong>নির্দেশনা:</strong> মাসিক সঞ্চয় আদায় করার পর সদস্যকে জেনারেটেড ডিজিটাল রশিদের হোয়াটসঅ্যাপ লিংকটি সরাসরি পাঠিয়ে দিতে পারেন।
          </div>
        </div>
      </div>
    </div>
  );
}
