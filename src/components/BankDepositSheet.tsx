/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BankDeposit, Payment } from '../types';
import { toBanglaDigits, formatCurrencyBangla } from '../utils';
import { Landmark, ArrowRight, CheckCircle2, ShieldAlert, Plus, Wallet } from 'lucide-react';

interface BankDepositSheetProps {
  bankDeposits: BankDeposit[];
  payments: Payment[];
  onAddBankDeposit: (deposit: BankDeposit) => void;
  isAdmin?: boolean;
}

export default function BankDepositSheet({
  bankDeposits,
  payments,
  onAddBankDeposit,
  isAdmin = true
}: BankDepositSheetProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankName, setBankName] = useState('ইসলামী ব্যাংক বাংলাদেশ লিমিটেড');
  const [branch, setBranch] = useState('মিরপুর শাখা');
  const [amount, setAmount] = useState<number | string>('');
  const [slipNumber, setSlipNumber] = useState('');
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');

  // Math summary
  const totalCashCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDeposited = bankDeposits.reduce((sum, b) => sum + b.amount, 0);
  const cashInHand = totalCashCollected - totalDeposited;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("জমার পরিমাণ অবশ্যই শূন্যের চেয়ে বড় হতে হবে!");
      return;
    }

    if (Number(amount) > cashInHand) {
      const confirmProceed = window.confirm(`সতর্কতা: আপনার ক্যাশ ইন হ্যান্ড ফান্ডে আছে ${formatCurrencyBangla(cashInHand)}। আপনি ব্যাংক ডিপোজিট করছেন ${formatCurrencyBangla(Number(amount))}। এটি ক্যাশ তহবিলের চেয়ে বেশি। তাও কি জমা করতে চান?`);
      if (!confirmProceed) return;
    }

    const payload: BankDeposit = {
      id: `BD-${String(bankDeposits.length + 1).padStart(4, '0')}`,
      date,
      bankName: bankName.trim(),
      branch: branch.trim(),
      amount: Number(amount),
      slipNumber: slipNumber.trim(),
      reference: reference.trim() || 'মাসিক সঞ্চয় তহবিল স্থানান্তর',
      remarks: remarks.trim()
    };

    onAddBankDeposit(payload);
    alert("ব্যাংক ডিপোজিট সফলভাবে নথিভুক্ত করা হয়েছে!");
    
    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setSlipNumber('');
    setReference('');
    setRemarks('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Landmark className="text-gold" />
            ব্যাংক ডিপোজিট রেজিস্টার (Bank Deposit Sheet)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            উত্তোলিত নগদ ক্যাশ থেকে ব্যাংকে জমাকৃত তহবিলের হিসাব রাখুন। ড্যাশবোর্ড ব্যাংক ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট হয়।
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            {showAddForm ? 'রেজিস্টার দেখুন' : <Plus size={16} />}
            {showAddForm ? 'রেজিস্টার দেখুন' : 'ব্যাংক জমা লিখুন'}
          </button>
        )}
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">মোট সংগৃহীত নগদ তহবিল</span>
            <span className="text-lg font-bold text-primary font-mono">{formatCurrencyBangla(totalCashCollected)}</span>
          </div>
          <div className="p-2 bg-emerald-50 text-primary rounded-lg">
            <Wallet size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">ব্যাংক মোট জমা (Bank Balance)</span>
            <span className="text-lg font-bold text-emerald-800 font-mono">{formatCurrencyBangla(totalDeposited)}</span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">
            <Landmark size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">অবশিষ্ট ক্যাশ-ইন-হ্যান্ড</span>
            <span className="text-lg font-bold text-amber-700 font-mono">{formatCurrencyBangla(cashInHand)}</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Wallet size={18} />
          </div>
        </div>
      </div>

      {/* Form or Table view */}
      {showAddForm ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border-l-4 border-gold shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-bold text-primary text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-gold" />
            ব্যাংক ডিপোজিট এন্ট্রি ফরম
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Field: Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">জমার তারিখ (Deposit Date)*</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                required
              />
            </div>

            {/* Field: Bank Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যাংকের নাম*</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="যেমন: ইসলামী ব্যাংক বাংলাদেশ পিএলসি"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Field: Branch */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">শাখার নাম*</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="যেমন: মিরপুর শাখা"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Field: Deposit Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">জমার পরিমাণ (Amount)*</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="যেমন: ৫০০০"
                  className="w-full pl-3 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold"
                  min="1"
                  required
                />
                <span className="absolute right-3.5 top-2 text-slate-400 font-bold text-sm">৳</span>
              </div>
            </div>

            {/* Field: Slip Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">রশিদ/স্লিপ নম্বর*</label>
              <input
                type="text"
                value={slipNumber}
                onChange={(e) => setSlipNumber(e.target.value)}
                placeholder="ব্যাংক স্লিপ নম্বর"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                required
              />
            </div>

            {/* Field: Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">রেফারেন্স</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="যেমন: জানুয়ারি সঞ্চয় স্থানান্তর"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Field: Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">অতিরিক্ত মন্তব্য (Remarks)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="ব্যাংক লেনদেন সম্পর্কিত অতিরিক্ত কোনো তথ্য থাকলে"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              বাতিল করুন
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-light text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <ArrowRight size={14} />
              ডিপোজিট সফল করুন
            </button>
          </div>
        </form>
      ) : (
        /* Table showing previous deposits */
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-sm text-primary mb-4 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700" />
            ব্যাংক আমানতের বিবরণী তালিকা
          </h3>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-100">
                  <th className="p-3">আইডি</th>
                  <th className="p-3">জমার তারিখ</th>
                  <th className="p-3">ব্যাংক ও শাখা</th>
                  <th className="p-3 text-right">পরিমাণ</th>
                  <th className="p-3 text-center">স্লিপ নম্বর</th>
                  <th className="p-3">রেফারেন্স</th>
                  <th className="p-3">মন্তব্য</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                {bankDeposits.length > 0 ? (
                  [...bankDeposits].reverse().map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold font-mono text-primary">{b.id}</td>
                      <td className="p-3 font-mono">{toBanglaDigits(b.date)}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900">{b.bankName}</span>
                        <span className="block text-[10px] text-slate-400 font-sans mt-0.5">{b.branch}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-800">{formatCurrencyBangla(b.amount)}</td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-600">{toBanglaDigits(b.slipNumber)}</td>
                      <td className="p-3">{b.reference || '―'}</td>
                      <td className="p-3 text-slate-400 truncate max-w-[150px]" title={b.remarks}>{b.remarks || '―'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      কোনো ব্যাংক ডিপোজিট রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
