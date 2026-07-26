/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BankDeposit, BankWithdrawal, ExpenseEntry, Payment, ExpenseCategory } from '../types';
import { toBanglaDigits, formatCurrencyBangla } from '../utils';
import { 
  Landmark, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Plus, 
  Wallet, 
  Edit2, 
  Trash2, 
  Camera, 
  X, 
  Image, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt, 
  PieChart, 
  FileText 
} from 'lucide-react';

interface BankDepositSheetProps {
  bankDeposits: BankDeposit[];
  bankWithdrawals: BankWithdrawal[];
  expenses: ExpenseEntry[];
  payments: Payment[];
  onAddBankDeposit: (deposit: BankDeposit) => void;
  onUpdateBankDeposit: (deposit: BankDeposit) => void;
  onDeleteBankDeposit: (id: string) => void;
  onAddBankWithdrawal: (withdrawal: BankWithdrawal) => void;
  onUpdateBankWithdrawal: (withdrawal: BankWithdrawal) => void;
  onDeleteBankWithdrawal: (id: string) => void;
  onAddExpense: (expense: ExpenseEntry) => void;
  onUpdateExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (id: string) => void;
  isAdmin?: boolean;
}

export default function BankDepositSheet({
  bankDeposits,
  bankWithdrawals,
  expenses,
  payments,
  onAddBankDeposit,
  onUpdateBankDeposit,
  onDeleteBankDeposit,
  onAddBankWithdrawal,
  onUpdateBankWithdrawal,
  onDeleteBankWithdrawal,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  isAdmin = true
}: BankDepositSheetProps) {
  const [activeSubTab, setActiveSubTab] = useState<'deposits' | 'withdrawals' | 'expenses' | 'summary'>('deposits');
  
  // Modal Photo Preview State
  const [viewingPhoto, setViewingPhoto] = useState<{ title: string; url: string } | null>(null);

  // --- Deposit Form States ---
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [editingDepositId, setEditingDepositId] = useState<string | null>(null);
  const [depDate, setDepDate] = useState(new Date().toISOString().split('T')[0]);
  const [depBankName, setDepBankName] = useState('জনতা ব্যাংক পিএলসি');
  const [depBranch, setDepBranch] = useState('ময়মনসিংহ শাখা');
  const [depAmount, setDepAmount] = useState<number | string>('');
  const [depSlipNumber, setDepSlipNumber] = useState('');
  const [depReference, setDepReference] = useState('');
  const [depRemarks, setDepRemarks] = useState('');
  const [depSlipPhoto, setDepSlipPhoto] = useState<string>('');

  // --- Withdrawal Form States ---
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [editingWithdrawId, setEditingWithdrawId] = useState<string | null>(null);
  const [witDate, setWitDate] = useState(new Date().toISOString().split('T')[0]);
  const [witBankName, setWitBankName] = useState('জনতা ব্যাংক পিএলসি');
  const [witBranch, setWitBranch] = useState('ময়মনসিংহ শাখা');
  const [witAmount, setWitAmount] = useState<number | string>('');
  const [witChequeNumber, setWitChequeNumber] = useState('');
  const [witPurpose, setWitPurpose] = useState<'Cash in Hand' | 'FDR Investment' | 'Direct Expense' | 'Member Refund' | 'Other'>('Cash in Hand');
  const [witReference, setWitReference] = useState('');
  const [witRemarks, setWitRemarks] = useState('');
  const [witChequePhoto, setWitChequePhoto] = useState<string>('');

  // --- Expense Form States ---
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Printing');
  const [expAmount, setExpAmount] = useState<number | string>('');
  const [expPaidFrom, setExpPaidFrom] = useState<'Cash in Hand' | 'Bank Withdrawal'>('Cash in Hand');
  const [expVouchersRef, setExpVouchersRef] = useState('');
  const [expRemarks, setExpRemarks] = useState('');
  const [expVoucherPhoto, setExpVoucherPhoto] = useState<string>('');

  // --- Financial Math Calculations ---
  const totalCashCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalBankDeposited = bankDeposits.reduce((sum, b) => sum + b.amount, 0);
  const totalBankWithdrawn = bankWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const netBankBalance = Math.max(0, totalBankDeposited - totalBankWithdrawn);

  // Cash in Hand calculation
  const cashFromWithdrawals = bankWithdrawals
    .filter(w => w.withdrawPurpose === 'Cash in Hand')
    .reduce((sum, w) => sum + w.amount, 0);
  
  const cashExpenses = expenses
    .filter(e => e.paidFrom === 'Cash in Hand')
    .reduce((sum, e) => sum + e.amount, 0);

  const cashInHand = Math.max(0, totalCashCollected - totalBankDeposited + cashFromWithdrawals - cashExpenses);

  // Total Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // FDR Balance Calculation
  const fdrFromWithdrawals = bankWithdrawals
    .filter(w => w.withdrawPurpose === 'FDR Investment')
    .reduce((sum, w) => sum + w.amount, 0);
  const fdrFromExpenses = expenses
    .filter(e => e.category === 'FDR')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalFDRBalance = fdrFromWithdrawals + fdrFromExpenses;

  // Image Upload Handler Helper with Automatic Canvas Compression (to avoid >1MB Firestore document limit)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 800;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          setter(compressedDataUrl);
        } else {
          setter(event.target?.result as string);
        }
      };
      img.onerror = () => {
        setter(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- DEPOSIT SUBMIT ---
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depAmount || Number(depAmount) <= 0) {
      alert("জমার পরিমাণ অবশ্যই শূন্যের চেয়ে বড় হতে হবে!");
      return;
    }

    const payload: BankDeposit = {
      id: editingDepositId || `BD-${String(bankDeposits.length + 1).padStart(4, '0')}`,
      date: depDate,
      bankName: depBankName.trim(),
      branch: depBranch.trim(),
      amount: Number(depAmount),
      slipNumber: depSlipNumber.trim(),
      reference: depReference.trim() || 'মাসিক সঞ্চয় তহবিল স্থানান্তর',
      remarks: depRemarks.trim(),
      slipPhoto: depSlipPhoto || ''
    };

    if (editingDepositId) {
      onUpdateBankDeposit(payload);
      alert("ডিপোজিট সফলভাবে আপডেট করা হয়েছে!");
    } else {
      onAddBankDeposit(payload);
      alert("ব্যাংক ডিপোজিট সফলভাবে নথিভুক্ত করা হয়েছে!");
    }
    
    resetDepositForm();
  };

  const resetDepositForm = () => {
    setEditingDepositId(null);
    setDepDate(new Date().toISOString().split('T')[0]);
    setDepBankName('জনতা ব্যাংক পিএলসি');
    setDepBranch('ময়মনসিংহ শাখা');
    setDepAmount('');
    setDepSlipNumber('');
    setDepReference('');
    setDepRemarks('');
    setDepSlipPhoto('');
    setShowDepositForm(false);
  };

  const handleStartEditDeposit = (b: BankDeposit) => {
    setEditingDepositId(b.id);
    setDepDate(b.date);
    setDepBankName(b.bankName);
    setDepBranch(b.branch);
    setDepAmount(b.amount);
    setDepSlipNumber(b.slipNumber);
    setDepReference(b.reference);
    setDepRemarks(b.remarks);
    setDepSlipPhoto(b.slipPhoto || '');
    setShowDepositForm(true);
  };

  // --- WITHDRAWAL SUBMIT ---
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!witAmount || Number(witAmount) <= 0) {
      alert("উত্তোলনের পরিমাণ অবশ্যই শূন্যের চেয়ে বড় হতে হবে!");
      return;
    }

    if (Number(witAmount) > netBankBalance && !editingWithdrawId) {
      const confirmProceed = window.confirm(`সতর্কতা: আপনার ব্যাংকে বর্তমানে গচ্ছিত আছে ${formatCurrencyBangla(netBankBalance)}। আপনি উত্তোলন করছেন ${formatCurrencyBangla(Number(witAmount))}। এটি গচ্ছিত ব্যালেন্সের চেয়ে বেশি। তাও কি নিশ্চিত করতে চান?`);
      if (!confirmProceed) return;
    }

    const payload: BankWithdrawal = {
      id: editingWithdrawId || `BW-${String(bankWithdrawals.length + 1).padStart(4, '0')}`,
      date: witDate,
      bankName: witBankName.trim(),
      branch: witBranch.trim(),
      amount: Number(witAmount),
      chequeNumber: witChequeNumber.trim(),
      withdrawPurpose: witPurpose,
      reference: witReference.trim() || 'ব্যাংক থেকে উত্তোলন',
      remarks: witRemarks.trim(),
      chequePhoto: witChequePhoto || ''
    };

    if (editingWithdrawId) {
      onUpdateBankWithdrawal(payload);
      alert("ব্যাংক উত্তোলন রেকর্ড সফলভাবে আপডেট করা হয়েছে!");
    } else {
      onAddBankWithdrawal(payload);
      alert("ব্যাংক উত্তোলন ও চেক তথ্য সফলভাবে রেকর্ড করা হয়েছে!");
    }

    resetWithdrawForm();
  };

  const resetWithdrawForm = () => {
    setEditingWithdrawId(null);
    setWitDate(new Date().toISOString().split('T')[0]);
    setWitBankName('জনতা ব্যাংক পিএলসি');
    setWitBranch('ময়মনসিংহ শাখা');
    setWitAmount('');
    setWitChequeNumber('');
    setWitPurpose('Cash in Hand');
    setWitReference('');
    setWitRemarks('');
    setWitChequePhoto('');
    setShowWithdrawForm(false);
  };

  const handleStartEditWithdraw = (w: BankWithdrawal) => {
    setEditingWithdrawId(w.id);
    setWitDate(w.date);
    setWitBankName(w.bankName);
    setWitBranch(w.branch);
    setWitAmount(w.amount);
    setWitChequeNumber(w.chequeNumber);
    setWitPurpose(w.withdrawPurpose);
    setWitReference(w.reference);
    setWitRemarks(w.remarks);
    setWitChequePhoto(w.chequePhoto || '');
    setShowWithdrawForm(true);
  };

  // --- EXPENSE SUBMIT ---
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) {
      alert("খরচের পরিমাণ অবশ্যই শূন্যের চেয়ে বড় হতে হবে!");
      return;
    }

    const payload: ExpenseEntry = {
      id: editingExpenseId || `EX-${String(expenses.length + 1).padStart(4, '0')}`,
      date: expDate,
      category: expCategory,
      amount: Number(expAmount),
      paidFrom: expPaidFrom,
      vouchersRef: expVouchersRef.trim() || 'VOUCHER',
      remarks: expRemarks.trim(),
      voucherPhoto: expVoucherPhoto || ''
    };

    if (editingExpenseId) {
      onUpdateExpense(payload);
      alert("খরচ এন্ট্রি সফলভাবে আপডেট করা হয়েছে!");
    } else {
      onAddExpense(payload);
      alert("সংগঠনের নতুন খরচ সফলভাবে রেকর্ড করা হয়েছে!");
    }

    resetExpenseForm();
  };

  const resetExpenseForm = () => {
    setEditingExpenseId(null);
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpCategory('Printing');
    setExpAmount('');
    setExpPaidFrom('Cash in Hand');
    setExpVouchersRef('');
    setExpRemarks('');
    setExpVoucherPhoto('');
    setShowExpenseForm(false);
  };

  const handleStartEditExpense = (ex: ExpenseEntry) => {
    setEditingExpenseId(ex.id);
    setExpDate(ex.date);
    setExpCategory(ex.category);
    setExpAmount(ex.amount);
    setExpPaidFrom(ex.paidFrom);
    setExpVouchersRef(ex.vouchersRef);
    setExpRemarks(ex.remarks);
    setExpVoucherPhoto(ex.voucherPhoto || '');
    setShowExpenseForm(true);
  };

  // Category Bangla Names
  const getCategoryBangla = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Printing': return 'প্রিন্টিং ও পোস্টার খরচ';
      case 'Stamp': return 'স্ট্যাম্প ও চুক্তিপত্র পেপার';
      case 'Meeting': return 'মিটিং আপ্যায়ন ও ভাড়া';
      case 'FDR': return 'ব্যাংক এফডিআর (FDR)';
      case 'Member Refund': return 'সদস্যের টাকা ফেরত';
      case 'Office': return 'অফিস পরিচালনা খরচ';
      case 'Other': return 'অন্যান্য জরুরি খরচ';
      default: return cat;
    }
  };

  const getPurposeBangla = (pur: string) => {
    switch (pur) {
      case 'Cash in Hand': return 'ক্যাশ ইন হ্যান্ড (নগদ ফান্ড)';
      case 'FDR Investment': return 'ব্যাংক এফডিআর (FDR)';
      case 'Direct Expense': return 'সরাসরি প্রজেক্ট/অফিস খরচ';
      case 'Member Refund': return 'সদস্যের সঞ্চয় ফেরত';
      default: return pur;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Landmark className="text-gold" />
            ব্যাংক ও তহবিল লেনদেন রেজিস্টার (Bank & Fund Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ব্যাংক ডিপোজিট, চেক মারফত টাকা উত্তোলন, চেক পাতার ছবি আপলোড, এফডিআর ও সংগঠনের সার্বিক খরচের স্বচ্ছ খতিয়ান।
          </p>
        </div>

        {/* Sub Navigation Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('deposits')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'deposits' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowUpRight size={13} className="text-emerald-400" />
            ব্যাংক ডিপোজিট ({toBanglaDigits(bankDeposits.length)})
          </button>
          <button
            onClick={() => setActiveSubTab('withdrawals')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'withdrawals' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ArrowDownLeft size={13} className="text-rose-400" />
            ব্যাংক উত্তোলন ({toBanglaDigits(bankWithdrawals.length)})
          </button>
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'expenses' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Receipt size={13} className="text-amber-400" />
            খরচ রেজিস্টার ({toBanglaDigits(expenses.length)})
          </button>
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'summary' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PieChart size={13} className="text-gold" />
            তহবিল সামারি & FDR
          </button>
        </div>
      </div>

      {/* Primary KPI Stats Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">বর্তমান ব্যাংক গচ্ছিত ব্যালেন্স</span>
          <span className="text-lg md:text-xl font-bold text-emerald-800 font-mono block mt-1">{formatCurrencyBangla(netBankBalance)}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">জমা মাইনাস উত্তোলন</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">হাতে নগদ অবশিষ্ট ফান্ড</span>
          <span className="text-lg md:text-xl font-bold text-amber-700 font-mono block mt-1">{formatCurrencyBangla(cashInHand)}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">ক্যাশ ইন হ্যান্ড ফান্ড</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">ব্যাংক এফডিআর (FDR) ব্যালেন্স</span>
          <span className="text-lg md:text-xl font-bold text-sky-700 font-mono block mt-1">{formatCurrencyBangla(totalFDRBalance)}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">মুনাফা/স্থায়ী আমানত</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">সংগঠনের মোট খরচ</span>
          <span className="text-lg md:text-xl font-bold text-rose-700 font-mono block mt-1">{formatCurrencyBangla(totalExpenses)}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">প্রিন্টিং, স্ট্যাম্প ও মিটিং</span>
        </div>
      </div>

      {/* --- SUB-TAB 1: BANK DEPOSITS --- */}
      {activeSubTab === 'deposits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-700" />
              ব্যাংক জমার তালিকা (Bank Deposit Records)
            </h3>
            {isAdmin && (
              <button
                onClick={() => {
                  if (showDepositForm) resetDepositForm();
                  else setShowDepositForm(true);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-0"
              >
                {showDepositForm ? 'তালিকা দেখুন' : <><Plus size={14} /> নতুন ব্যাংক জমা এন্ট্রি</>}
              </button>
            )}
          </div>

          {showDepositForm ? (
            <form onSubmit={handleDepositSubmit} className="bg-white p-6 rounded-2xl border-l-4 border-emerald-600 shadow-sm space-y-4">
              <h3 className="font-bold text-primary text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-emerald-600" />
                {editingDepositId ? 'ব্যাংক ডিপোজিট সংশোধন' : 'নতুন ব্যাংক ডিপোজিট এন্ট্রি ফরম'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">জমার তারিখ*</label>
                  <input
                    type="date"
                    value={depDate}
                    onChange={(e) => setDepDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যাংকের নাম*</label>
                  <input
                    type="text"
                    value={depBankName}
                    onChange={(e) => setDepBankName(e.target.value)}
                    placeholder="যেমন: জনতা ব্যাংক পিএলসি"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শাখার নাম*</label>
                  <input
                    type="text"
                    value={depBranch}
                    onChange={(e) => setDepBranch(e.target.value)}
                    placeholder="যেমন: ময়মনসিংহ শাখা"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">জমার পরিমাণ (টাকা)*</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depAmount}
                      onChange={(e) => setDepAmount(Number(e.target.value))}
                      placeholder="যেমন: ৫০০০"
                      className="w-full pl-3 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold"
                      min="1"
                      required
                    />
                    <span className="absolute right-3.5 top-2 text-slate-400 font-bold text-sm">৳</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">স্লিপ নম্বর*</label>
                  <input
                    type="text"
                    value={depSlipNumber}
                    onChange={(e) => setDepSlipNumber(e.target.value)}
                    placeholder="যেমন: SL-92817"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">রেফারেন্স</label>
                  <input
                    type="text"
                    value={depReference}
                    onChange={(e) => setDepReference(e.target.value)}
                    placeholder="যেমন: সঞ্চয় তহবিল জমা"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">অতিরিক্ত মন্তব্য</label>
                <input
                  type="text"
                  value={depRemarks}
                  onChange={(e) => setDepRemarks(e.target.value)}
                  placeholder="ব্যাংক জমা সংক্রান্ত অতিরিক্ত তথ্য"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Deposit Slip Photo */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-600">জমা স্লিপ সংযুক্ত করুন (Upload Deposit Slip - Optional)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setDepSlipPhoto)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 shadow-sm transition-all">
                      <Camera size={14} className="text-primary" />
                      স্লিপ ছবি আপলোড করুন
                    </div>
                  </div>

                  {depSlipPhoto ? (
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-white">
                        <img src={depSlipPhoto} alt="Deposit Slip Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setDepSlipPhoto('')}
                          className="absolute top-0.5 right-0.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors border-0"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> স্লিপ সংযুক্ত হয়েছে!
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">কোনো স্লিপ সংযুক্ত করা হয়নি (ঐচ্ছিক)।</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={resetDepositForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer border-0">
                  বাতিল করুন
                </button>
                <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-light text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer border-0">
                  <ArrowRight size={14} /> {editingDepositId ? 'সংশোধন সম্পন্ন করুন' : 'ডিপোজিট সেভ করুন'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-100">
                      <th className="p-3">আইডি</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">ব্যাংক ও শাখা</th>
                      <th className="p-3 text-right">পরিমাণ</th>
                      <th className="p-3 text-center">স্লিপ নং</th>
                      <th className="p-3">রেফারেন্স</th>
                      <th className="p-3 text-center">স্লিপ ছবি</th>
                      {isAdmin && <th className="p-3 text-center">অ্যাকশন</th>}
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
                            <span className="block text-[10px] text-slate-400">{b.branch}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-800">{formatCurrencyBangla(b.amount)}</td>
                          <td className="p-3 text-center font-mono font-semibold">{toBanglaDigits(b.slipNumber)}</td>
                          <td className="p-3">{b.reference || '―'}</td>
                          <td className="p-3 text-center">
                            {b.slipPhoto ? (
                              <button
                                onClick={() => setViewingPhoto({ title: 'ব্যাংক জমা স্লিপ', url: b.slipPhoto! })}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg flex items-center justify-center gap-1 mx-auto border border-emerald-200 cursor-pointer text-[10px]"
                              >
                                <Image size={12} /> স্লিপ দেখুন
                              </button>
                            ) : (
                              <span className="text-slate-400">―</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleStartEditDeposit(b)} className="p-1 text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer border-0" title="সম্পাদনা">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => { if(window.confirm('নিশ্চিতভাবে মুছবেন?')) onDeleteBankDeposit(b.id); }} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer border-0" title="মুছুন">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-slate-400">
                          কোনো ব্যাংক জমা তথ্য পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 2: BANK WITHDRAWALS --- */}
      {activeSubTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <ArrowDownLeft size={16} className="text-rose-600" />
                ব্যাংক উত্তোলন ও চেক রেজিস্টার (Bank Withdrawals & Cheque Leaves)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ব্যাংক থেকে চেক বই দিয়ে উত্তোলিত নগদ টাকা বা এফডিআর স্থানান্তরের হিসাব। চেক পাতার ছবি আপলোড করতে পারবেন।
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  if (showWithdrawForm) resetWithdrawForm();
                  else setShowWithdrawForm(true);
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer border-0"
              >
                {showWithdrawForm ? 'তালিকা দেখুন' : <><Plus size={14} /> নতুন ব্যাংক উত্তোলন</>}
              </button>
            )}
          </div>

          {showWithdrawForm ? (
            <form onSubmit={handleWithdrawSubmit} className="bg-white p-6 rounded-2xl border-l-4 border-rose-600 shadow-sm space-y-4">
              <h3 className="font-bold text-primary text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-rose-600" />
                {editingWithdrawId ? 'ব্যাংক উত্তোলন তথ্য সংশোধন' : 'নতুন ব্যাংক উত্তোলন ও চেক পাতা ভরাট করুন'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">উত্তোলনের তারিখ*</label>
                  <input
                    type="date"
                    value={witDate}
                    onChange={(e) => setWitDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">উত্তোলনের উদ্দেশ্য (Purpose)*</label>
                  <select
                    value={witPurpose}
                    onChange={(e) => setWitPurpose(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white font-medium text-slate-800"
                  >
                    <option value="Cash in Hand">ক্যাশ ইন হ্যান্ড (অফিস খরচ ও হাতে নগদ)</option>
                    <option value="FDR Investment">অন্য ব্যাংকে FDR করা</option>
                    <option value="Direct Expense">সরাসরি খরচ মেটানো</option>
                    <option value="Member Refund">সদস্যকে টাকা/সঞ্চয় ফেরত</option>
                    <option value="Other">অন্যান্য প্রজেক্ট উদ্দেশ্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">চেক নম্বর (Cheque No.)*</label>
                  <input
                    type="text"
                    value={witChequeNumber}
                    onChange={(e) => setWitChequeNumber(e.target.value)}
                    placeholder="যেমন: CQ-883921"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ব্যাংকের নাম*</label>
                  <input
                    type="text"
                    value={witBankName}
                    onChange={(e) => setWitBankName(e.target.value)}
                    placeholder="যেমন: জনতা ব্যাংক পিএলসি"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">শাখার নাম*</label>
                  <input
                    type="text"
                    value={witBranch}
                    onChange={(e) => setWitBranch(e.target.value)}
                    placeholder="যেমন: ময়মনসিংহ শাখা"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">উত্তোলনের পরিমাণ (টাকা)*</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={witAmount}
                      onChange={(e) => setWitAmount(Number(e.target.value))}
                      placeholder="যেমন: ২০০০০"
                      className="w-full pl-3 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold text-rose-700"
                      min="1"
                      required
                    />
                    <span className="absolute right-3.5 top-2 text-slate-400 font-bold text-sm">৳</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">রেফারেন্স/কারণ</label>
                  <input
                    type="text"
                    value={witReference}
                    onChange={(e) => setWitReference(e.target.value)}
                    placeholder="যেমন: প্রিন্টিং ও স্ট্যাম্প খরচের জন্য ক্যাশ উত্তোলন"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">অতিরিক্ত মন্তব্য (Remarks)</label>
                  <input
                    type="text"
                    value={witRemarks}
                    onChange={(e) => setWitRemarks(e.target.value)}
                    placeholder="চেকপ্রাপকের নাম বা বিস্তারিত"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Cheque Leaf Attachment Field */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-700">চেক পাতার ছবি আপলোড করুন (Upload Cheque Leaf Photo)*</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-rose-50/50 p-4 rounded-xl border border-dashed border-rose-200">
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setWitChequePhoto)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="px-4 py-2 bg-white hover:bg-slate-100 text-rose-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm transition-all">
                      <Camera size={14} className="text-rose-600" />
                      চেক পাতার ছবি পিক করুন
                    </div>
                  </div>

                  {witChequePhoto ? (
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-white">
                        <img src={witChequePhoto} alt="Cheque Leaf Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setWitChequePhoto('')}
                          className="absolute top-0.5 right-0.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors border-0"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> চেক পাতা সফলভাবে ছবি যুক্ত হয়েছে!
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">কোনো চেক পাতা ছবি যুক্ত করা হয়নি (ঐচ্ছিক/প্রয়োজনে আপলোড করুন)।</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={resetWithdrawForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer border-0">
                  বাতিল করুন
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer border-0">
                  <ArrowRight size={14} /> {editingWithdrawId ? 'সংশোধন সম্পন্ন করুন' : 'উত্তোলন কনফার্ম করুন'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-100">
                      <th className="p-3">আইডি</th>
                      <th className="p-3">উত্তোলনের তারিখ</th>
                      <th className="p-3">চেক নম্বর</th>
                      <th className="p-3">উদ্দেশ্য (Purpose)</th>
                      <th className="p-3">ব্যাংক ও শাখা</th>
                      <th className="p-3 text-right">পরিমাণ</th>
                      <th className="p-3 text-center">চেক পাতার ছবি</th>
                      {isAdmin && <th className="p-3 text-center">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                    {bankWithdrawals.length > 0 ? (
                      [...bankWithdrawals].reverse().map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold font-mono text-rose-700">{w.id}</td>
                          <td className="p-3 font-mono">{toBanglaDigits(w.date)}</td>
                          <td className="p-3 font-mono font-bold text-slate-800">{w.chequeNumber}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {getPurposeBangla(w.withdrawPurpose)}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-900">{w.bankName}</span>
                            <span className="block text-[10px] text-slate-400">{w.branch}</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-700">{formatCurrencyBangla(w.amount)}</td>
                          <td className="p-3 text-center">
                            {w.chequePhoto ? (
                              <button
                                onClick={() => setViewingPhoto({ title: `চেক পাতার ছবি (${w.chequeNumber})`, url: w.chequePhoto! })}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg flex items-center justify-center gap-1 mx-auto border border-rose-200 cursor-pointer text-[10px]"
                              >
                                <Image size={12} /> চেক ছবি
                              </button>
                            ) : (
                              <span className="text-slate-400">―</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleStartEditWithdraw(w)} className="p-1 text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer border-0" title="সম্পাদনা">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => { if(window.confirm('নিশ্চিতভাবে মুছবেন?')) onDeleteBankWithdrawal(w.id); }} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer border-0" title="মুছুন">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-slate-400">
                          কোনো ব্যাংক উত্তোলন বা চেক রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 3: EXPENSE REGISTER --- */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <Receipt size={16} className="text-amber-600" />
                সংগঠনের খরচ রেজিস্টার (Expense Register)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                প্রিন্টিং, স্ট্যাম্প, মিটিং, অফিসিয়াল খরচ, বা সদস্যের সঞ্চয় টাকা ফেরতের বিবরণী ও ভাউচার।
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  if (showExpenseForm) resetExpenseForm();
                  else setShowExpenseForm(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer border-0"
              >
                {showExpenseForm ? 'তালিকা দেখুন' : <><Plus size={14} /> নতুন খরচ যোগ করুন</>}
              </button>
            )}
          </div>

          {showExpenseForm ? (
            <form onSubmit={handleExpenseSubmit} className="bg-white p-6 rounded-2xl border-l-4 border-amber-500 shadow-sm space-y-4">
              <h3 className="font-bold text-primary text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-amber-500" />
                {editingExpenseId ? 'খরচ তথ্য সংশোধন' : 'নতুন খরচ ভাউচার এন্ট্রি ফরম'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">খরচের তারিখ*</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">খরচের খাত (Expense Category)*</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white font-medium text-slate-800"
                  >
                    <option value="Printing">প্রিন্টিং, ব্যানার ও লিফলেট</option>
                    <option value="Stamp">অফিসিয়াল স্ট্যাম্প ও পেপার</option>
                    <option value="Meeting">সভা, খাবার ও মিটিং খরচ</option>
                    <option value="Member Refund">সদস্যের ফান্ড/সঞ্চয় ফেরত</option>
                    <option value="Office">অফিসিয়াল খরচ</option>
                    <option value="FDR">অন্য ব্যাংকে FDR করা</option>
                    <option value="Other">অন্যান্য আপদকালীন খরচ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পরিশোধের উৎস (Paid From)*</label>
                  <select
                    value={expPaidFrom}
                    onChange={(e) => setExpPaidFrom(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white font-medium text-slate-800"
                  >
                    <option value="Cash in Hand">হাতে নগদ (Cash in Hand)</option>
                    <option value="Bank Withdrawal">সরাসরি ব্যাংক থেকে পরিশোধ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">পরিমাণ (টাকা)*</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={expAmount}
                      onChange={(e) => setExpAmount(Number(e.target.value))}
                      placeholder="যেমন: ১৫০০"
                      className="w-full pl-3 pr-10 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-bold text-amber-700"
                      min="1"
                      required
                    />
                    <span className="absolute right-3.5 top-2 text-slate-400 font-bold text-sm">৳</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ভাউচার/মেমো রেফারেন্স</label>
                  <input
                    type="text"
                    value={expVouchersRef}
                    onChange={(e) => setExpVouchersRef(e.target.value)}
                    placeholder="যেমন: V-101 / মেমো নং"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">অতিরিক্ত বিবরণ/মন্তব্য</label>
                  <input
                    type="text"
                    value={expRemarks}
                    onChange={(e) => setExpRemarks(e.target.value)}
                    placeholder="খরচ সম্পর্কিত বিস্তারিত বিবরণ"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Voucher Memo Photo */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-700">ভাউচার / ক্যাশ মেমোর ছবি আপলোড করুন (Upload Voucher/Memo Photo)</label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-amber-50/50 p-4 rounded-xl border border-dashed border-amber-200">
                  <div className="relative inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setExpVoucherPhoto)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="px-4 py-2 bg-white hover:bg-slate-100 text-amber-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-amber-200 shadow-sm transition-all">
                      <Camera size={14} className="text-amber-600" />
                      মেমো / ভাউচারের ছবি ছবি তুলুন
                    </div>
                  </div>

                  {expVoucherPhoto ? (
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-white">
                        <img src={expVoucherPhoto} alt="Voucher Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setExpVoucherPhoto('')}
                          className="absolute top-0.5 right-0.5 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors border-0"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> ভাউচার ছবি সংযুক্ত হয়েছে!
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">কোনো মেমো ছবি যুক্ত করা হয়নি (ঐচ্ছিক)।</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={resetExpenseForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer border-0">
                  বাতিল করুন
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer border-0">
                  <ArrowRight size={14} /> {editingExpenseId ? 'সংশোধন সম্পন্ন করুন' : 'খরচ এনভোলপ সেভ করুন'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-100">
                      <th className="p-3">আইডি</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">খরচের খাত</th>
                      <th className="p-3">উৎসব/পরিশোধের মাধ্যম</th>
                      <th className="p-3 text-right">পরিমাণ</th>
                      <th className="p-3">মেমো নং</th>
                      <th className="p-3 text-center">মেমো ছবি</th>
                      {isAdmin && <th className="p-3 text-center">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 text-slate-700">
                    {expenses.length > 0 ? (
                      [...expenses].reverse().map((ex) => (
                        <tr key={ex.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold font-mono text-amber-700">{ex.id}</td>
                          <td className="p-3 font-mono">{toBanglaDigits(ex.date)}</td>
                          <td className="p-3 font-bold text-slate-800">{getCategoryBangla(ex.category)}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {ex.paidFrom === 'Cash in Hand' ? 'হাতে নগদ' : 'ব্যাংক থেকে'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-800">{formatCurrencyBangla(ex.amount)}</td>
                          <td className="p-3 font-mono text-slate-500">{ex.vouchersRef || '―'}</td>
                          <td className="p-3 text-center">
                            {ex.voucherPhoto ? (
                              <button
                                onClick={() => setViewingPhoto({ title: `ভাউচার / মেমো ছবি (${ex.id})`, url: ex.voucherPhoto! })}
                                className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold rounded-lg flex items-center justify-center gap-1 mx-auto border border-amber-200 cursor-pointer text-[10px]"
                              >
                                <Image size={12} /> মেমো দেখুন
                              </button>
                            ) : (
                              <span className="text-slate-400">―</span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleStartEditExpense(ex)} className="p-1 text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer border-0" title="সম্পাদনা">
                                  <Edit2 size={13} />
                                </button>
                                <button onClick={() => { if(window.confirm('নিশ্চিতভাবে মুছবেন?')) onDeleteExpense(ex.id); }} className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer border-0" title="মুছুন">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="p-8 text-center text-slate-400">
                          কোনো খরচ তথ্য পাওয়া যায়নি।
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 4: FUND & FDR SUMMARY --- */}
      {activeSubTab === 'summary' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-lg text-primary flex items-center gap-2">
              <PieChart className="text-gold" />
              সংগঠনের তহবিল, ব্যাংক ও এফডিআর গাণিতিক বিবরণী
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              সকল সদস্যের মোট সঞ্চয় সংগ্রহ, ব্যাংকে জমা, চেক উত্তোলন, হাতে নগদ এবং ব্যাংক FDR হিসাবের সঠিক রিপোর্ট।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Balance Sheet Breakdown */}
            <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-slate-200 pb-2">
                <Wallet size={16} className="text-emerald-700" />
                ফান্ড সংগ্রহের হিসাব
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">১. সকল সদস্য থেকে মোট সংগ্রহ:</span>
                  <span className="font-bold font-mono text-primary">{formatCurrencyBangla(totalCashCollected)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">২. ব্যাংকে মোট জমা করা হয়েছে:</span>
                  <span className="font-bold font-mono text-emerald-800">(-) {formatCurrencyBangla(totalBankDeposited)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">৩. ব্যাংক থেকে নগদ ক্যাশ উত্তোলন:</span>
                  <span className="font-bold font-mono text-amber-700">(+) {formatCurrencyBangla(cashFromWithdrawals)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">৪. ক্যাশ থেকে মোট অফিস/পরিচালনা খরচ:</span>
                  <span className="font-bold font-mono text-rose-700">(-) {formatCurrencyBangla(cashExpenses)}</span>
                </div>
                <div className="flex justify-between py-2 pt-3 font-bold text-sm text-primary border-t-2 border-slate-300">
                  <span>হাতে নগদ অবশিষ্ট তহবিল (Cash in Hand):</span>
                  <span className="font-mono text-amber-700">{formatCurrencyBangla(cashInHand)}</span>
                </div>
              </div>
            </div>

            {/* Right Bank & FDR Breakdown */}
            <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h4 className="font-bold text-sm text-primary flex items-center gap-2 border-b border-slate-200 pb-2">
                <Landmark size={16} className="text-blue-700" />
                ব্যাংক ও এফডিআর (FDR) স্থিতি
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">১. ব্যাংকে সর্বমোট ডিপোজিট:</span>
                  <span className="font-bold font-mono text-emerald-800">{formatCurrencyBangla(totalBankDeposited)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">২. ব্যাংক থেকে সর্বমোট উত্তোলন:</span>
                  <span className="font-bold font-mono text-rose-700">(-) {formatCurrencyBangla(totalBankWithdrawn)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200 font-bold text-emerald-900">
                  <span>বর্তমান ব্যাংকে গচ্ছিত আমানত:</span>
                  <span className="font-mono">{formatCurrencyBangla(netBankBalance)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">৩. ব্যাংক FDR মূলধন বিনিয়োগ:</span>
                  <span className="font-bold font-mono text-sky-700">{formatCurrencyBangla(totalFDRBalance)}</span>
                </div>
                <div className="flex justify-between py-2 pt-3 font-bold text-sm text-primary border-t-2 border-slate-300">
                  <span>সংগঠনের মোট সম্পদ (ক্যাশ + ব্যাংক + FDR):</span>
                  <span className="font-mono text-emerald-800">{formatCurrencyBangla(cashInHand + netBankBalance + totalFDRBalance)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo View Zoom Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingPhoto(null)}>
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 space-y-3 relative shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Image size={14} className="text-gold" />
                {viewingPhoto.title}
              </span>
              <button onClick={() => setViewingPhoto(null)} className="text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer border-0">
                <X size={18} />
              </button>
            </div>
            <div className="aspect-auto max-h-[70vh] overflow-auto rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 p-2">
              <img src={viewingPhoto.url} alt={viewingPhoto.title} className="max-w-full max-h-[65vh] object-contain rounded-xl" referrerPolicy="no-referrer" />
            </div>
            <div className="text-center pt-2">
              <button onClick={() => setViewingPhoto(null)} className="px-5 py-2 bg-primary hover:bg-primary-light text-white font-bold text-xs rounded-xl cursor-pointer border-0 shadow-sm">
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
