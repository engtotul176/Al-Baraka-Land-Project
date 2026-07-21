/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Member, Payment, PaymentType } from '../types';
import { X, Save, AlertTriangle } from 'lucide-react';

interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  members: Member[];
  onSave: (updatedPayment: Payment) => void;
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

export default function EditPaymentModal({
  isOpen,
  onClose,
  payment,
  members,
  onSave
}: EditPaymentModalProps) {
  if (!isOpen || !payment) return null;

  const [memberId, setMemberId] = useState(payment.memberId);
  const [paymentType, setPaymentType] = useState<PaymentType>(payment.paymentType);
  const [amount, setAmount] = useState(payment.amount);
  const [month, setMonth] = useState(payment.month);
  const [year, setYear] = useState(payment.year);
  const [entryDate, setEntryDate] = useState(payment.entryDate);
  const [remarks, setRemarks] = useState(payment.remarks);

  useEffect(() => {
    if (payment) {
      setMemberId(payment.memberId);
      setPaymentType(payment.paymentType);
      setAmount(payment.amount);
      setMonth(payment.month);
      setYear(payment.year);
      setEntryDate(payment.entryDate);
      setRemarks(payment.remarks);
    }
  }, [payment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMember = members.find(m => m.memberId === memberId);
    if (!selectedMember) {
      alert("সঠিক সদস্য নির্বাচন করুন!");
      return;
    }

    if (amount <= 0) {
      alert("টাকার পরিমাণ অবশ্যই ০ এর বেশি হতে হবে!");
      return;
    }

    const updatedPayment: Payment = {
      ...payment,
      memberId,
      memberName: selectedMember.name,
      paymentType,
      amount: Number(amount),
      month,
      year: Number(year),
      entryDate,
      remarks
    };

    onSave(updatedPayment);
    onClose();
  };

  return (
    <div id="edit-payment-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-white/10 rounded-lg text-gold font-bold font-mono text-xs">
              {payment.receiptNo}
            </span>
            <h3 className="text-base font-bold">পেমেন্ট এন্ট্রি সংশোধন করুন</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-700">
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2.5 items-start">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <div className="text-[11px] text-amber-800 leading-relaxed font-medium">
              সতর্কতা: রশিদ নম্বর <strong>{payment.receiptNo}</strong> পরিবর্তন করা যাবে না। তবে জমার সদস্য, টাকার পরিমাণ, খাত এবং মাস সংশোধন করতে পারবেন।
            </div>
          </div>

          <div className="space-y-4">
            {/* Member selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600">আদায়কৃত সদস্য*</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                required
              >
                <option value="">সদস্য সিলেক্ট করুন</option>
                {members.map(m => (
                  <option key={m.memberId} value={m.memberId}>
                    [{m.memberId}] {m.name} ({m.mobile})
                  </option>
                ))}
              </select>
            </div>

            {/* Grid 2 Columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">প্রাপ্তির খাত*</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:border-primary"
                  required
                >
                  <option value="Monthly Deposit">মাসিক সঞ্চয়</option>
                  <option value="Registration Fee">রেজিস্ট্রেশন ফি</option>
                  <option value="Meeting Fee">মিটিং ফি</option>
                  <option value="Fine">বিলম্ব জরিমানা</option>
                  <option value="Donation">দান/অনুদানি ফান্ড</option>
                  <option value="Other">অন্যান্য প্রাপ্তি</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">জমার পরিমাণ (টাকা)*</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold"
                  placeholder="টাকার পরিমাণ লিখুন"
                  required
                />
              </div>
            </div>

            {/* Grid 3 Columns */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5 col-span-2">
                <label className="block text-xs font-bold text-slate-600">হিসাব মাস*</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary font-medium"
                  required
                >
                  {MONTHS_LIST.map(m => (
                    <option key={m.name} value={m.name}>{m.bangla}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">বছর*</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-primary font-mono"
                  required
                >
                  {[2026, 2027, 2028, 2029, 2030].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">আদায়ের তারিখ*</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">মন্তব্য</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                  placeholder="যেমন: রশিদ সংশোধন করা হল"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-light rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save size={15} />
              তথ্য সংরক্ষণ করুন
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
