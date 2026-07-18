/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { Payment, Member, SystemSettings } from '../types';
import { toBanglaDigits, formatCurrencyBangla, toBanglaWords } from '../utils';
import { Printer, Share2, CornerDownRight, MessageSquare, Download, CheckSquare } from 'lucide-react';

interface ReceiptSheetProps {
  payments: Payment[];
  members: Member[];
  settings: SystemSettings;
  selectedReceiptNo: string;
  onSelectReceipt: (receiptNo: string) => void;
}

export default function ReceiptSheet({
  payments,
  members,
  settings,
  selectedReceiptNo,
  onSelectReceipt
}: ReceiptSheetProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Find active payment
  const activePayment = payments.find(p => p.receiptNo === selectedReceiptNo) || payments[0];
  
  // Find associated member
  const activeMember = activePayment 
    ? members.find(m => m.memberId === activePayment.memberId) 
    : null;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Generate WhatsApp text and link
  const getWhatsAppLink = () => {
    if (!activePayment) return '#';
    const phone = activeMember ? activeMember.whatsapp : settings.founderMobile;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? `88${cleanPhone}` : cleanPhone;

    const message = `আসসালামু আলাইকুম, সম্মানিত ${activePayment.memberName}।
আপনার আল-বারাকা ভূমি প্রকল্প (সদস্য আইডি: ${activePayment.memberId}) এর ${activePayment.month} মাসের সঞ্চয় বা ফি বাবদ ${activePayment.amount} ৳ জমা সফল হয়েছে।

রশিদ নং: ${activePayment.receiptNo}
তারিখ: ${toBanglaDigits(activePayment.entryDate)}
বিবরণ: ${activePayment.remarks || activePayment.paymentType}

ডিজিটাল রশিদের তথ্যের জন্য আপনার ড্যাশবোর্ড খতিয়ান ভিজিট করুন।
ধন্যবাদান্তে,
${settings.founderName}
${settings.orgName}`;

    return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      {/* Receipts Switcher & Tool Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Printer className="text-gold" />
            ডিজিটাল টাকা প্রাপ্তির রশিদ (Receipt)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            যে কোনো লেনদেন সিলেক্ট করে ওয়ান-ক্লিক প্রিন্ট, পিডিএফ ডাউনলোড বা হোয়াটসঅ্যাপে রশিদ শেয়ার করুন।
          </p>
        </div>

        {/* Dynamic Selector Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">রশিদ সিলেক্ট করুন:</label>
          <select
            value={selectedReceiptNo}
            onChange={(e) => onSelectReceipt(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white font-mono font-bold text-primary"
          >
            {payments.map(p => (
              <option key={p.receiptNo} value={p.receiptNo}>
                {p.receiptNo} - {p.memberName}
              </option>
            ))}
          </select>

          {/* Quick PDF Print Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer size={14} />
            রশিদ প্রিন্ট / PDF
          </button>

          {/* Share via WhatsApp */}
          {activePayment && (
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <MessageSquare size={14} />
              WhatsApp শেয়ার
            </a>
          )}
        </div>
      </div>

      {/* Actual Printable Receipt Container */}
      {activePayment ? (
        <div className="flex justify-center p-2 sm:p-4">
          <div 
            ref={receiptRef}
            className="w-full max-w-[750px] bg-white border-8 border-double border-primary p-6 sm:p-10 rounded-xl relative shadow-md print-shadow-none bg-[radial-gradient(#01322005_1px,transparent_1px)] [background-size:16px_16px]"
          >
            {/* Watermark Logo Center Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
              <img src={settings.logo} alt="Watermark" className="w-[350px] h-[350px]" referrerPolicy="no-referrer" />
            </div>

            {/* Receipt Header Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-gold pb-5 gap-4">
              {/* Org Logo Graphic */}
              <div className="w-24 h-24 flex-shrink-0 bg-primary/5 p-1 rounded-full border border-gold/40 flex items-center justify-center">
                <img 
                  src={settings.logo} 
                  alt="Al-Baraka Logo"
                  referrerPolicy="no-referrer" 
                  className="w-full h-full object-contain" 
                />
              </div>

              {/* Org Name & Address */}
              <div className="text-center flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-wide font-sans">{settings.orgName}</h1>
                <p className="text-gold font-bold text-xs italic tracking-wider mt-1">{settings.orgSlogan}</p>
                <div className="text-[11px] text-slate-500 space-y-0.5 mt-2 font-medium">
                  <p>ঠিকানা: {settings.orgAddress}</p>
                  <p>মোবাইল: {toBanglaDigits(settings.orgMobile)} | ইমেইল: {settings.orgEmail}</p>
                </div>
              </div>

              {/* Founder/Admin Portrait Right */}
              <div className="text-center flex-shrink-0">
                <div className="w-18 h-22 rounded-lg border-2 border-amber-500 overflow-hidden shadow-md mx-auto bg-slate-100 relative group">
                  <img 
                    src={settings.founderPhoto} 
                    alt={settings.founderName}
                    referrerPolicy="no-referrer" 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-amber-500 text-[7px] font-black text-slate-950 py-0.5 leading-none">
                    প্রতিষ্ঠাতা
                  </div>
                </div>
                <p className="text-[9px] font-extrabold text-primary mt-1.5 leading-tight">{settings.founderName}</p>
                <p className="text-[8px] text-slate-400 font-sans">{settings.founderDesignation}</p>
              </div>
            </div>

            {/* Receipt Metadata Title and Badges */}
            <div className="flex justify-between items-center my-6">
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                রশিদ নং: <span className="font-bold text-primary">{activePayment.receiptNo}</span>
              </span>
              
              <div className="border border-primary px-5 py-1.5 rounded-full font-bold text-sm text-primary bg-emerald-50/50">
                টাকা প্রাপ্তির রশিদ
              </div>

              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                তারিখ: <span className="font-bold text-primary">{toBanglaDigits(activePayment.entryDate)}</span>
              </span>
            </div>

            {/* Receipt Body Table details */}
            <div className="space-y-5">
              {/* Member profile information block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="text-slate-400 w-24">সদস্যের নাম:</span>
                    <span className="font-bold text-slate-900">{activePayment.memberName}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-400 w-24">পিতার নাম:</span>
                    <span className="font-semibold text-slate-700">{activeMember ? activeMember.fatherName : '―'}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-400 w-24">মোবাইল নম্বর:</span>
                    <span className="font-semibold text-slate-700 font-mono">{toBanglaDigits(activePayment.memberId)} / {toBanglaDigits(activeMember ? activeMember.mobile : '')}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="flex">
                    <span className="text-slate-400 w-24">সদস্য আইডি:</span>
                    <span className="font-bold text-primary font-mono">{activePayment.memberId}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-400 w-24">পরিশোধের মাস:</span>
                    <span className="font-bold text-slate-800">{activePayment.month} - {toBanglaDigits(activePayment.year)}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-400 w-24">স্ট্যাটাস:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                      <CheckSquare size={13} /> পরিশোধিত (Paid)
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Breakdown Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-3 bg-primary text-white font-bold p-3 text-center">
                  <div className="text-left col-span-2 pl-2">আদায়ের বিবরণ / প্রাপ্তির খাত</div>
                  <div>পরিমাণ (টাকা)</div>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-3 p-3 text-center">
                    <div className="text-left col-span-2 pl-2 font-medium">
                      {activePayment.paymentType === 'Monthly Deposit' ? 'মাসিক সঞ্চয় আদায়' : 
                       activePayment.paymentType === 'Registration Fee' ? 'সদস্য ভর্তি/রেজিস্ট্রেশন ফি' : 
                       activePayment.paymentType === 'Meeting Fee' ? 'মাসিক/সাধারণ সভা ফি' : 
                       activePayment.paymentType === 'Fine' ? 'বিলম্ব জরিমানা (Fine)' : activePayment.paymentType}
                      <span className="block text-[10px] text-slate-400 mt-1 font-sans">{activePayment.remarks || 'আল-বারাকা তহবিল ভুক্তি'}</span>
                    </div>
                    <div className="font-mono font-bold text-slate-800 text-sm self-center">
                      {formatCurrencyBangla(activePayment.amount)}
                    </div>
                  </div>
                  
                  {/* Totals Section */}
                  <div className="grid grid-cols-3 p-3 text-center bg-slate-50 font-bold text-primary">
                    <div className="text-right col-span-2 pr-4 self-center text-xs text-slate-500">সর্বমোট জমাকৃত অংক:</div>
                    <div className="font-mono text-base font-extrabold">{formatCurrencyBangla(activePayment.amount)}</div>
                  </div>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="bg-primary/5 border border-primary/10 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <span className="text-slate-500 font-semibold flex-shrink-0">কথায় (In Words):</span>
                <span className="font-bold text-primary">{toBanglaWords(activePayment.amount)}</span>
              </div>
            </div>

            {/* Bottom Footer block containing signatures, QR code verification link */}
            {/* Bottom Footer block containing 3 authority signatures, customer signature, and QR code */}
            <div className="grid grid-cols-5 gap-2 items-end mt-12 border-t border-slate-100 pt-6">
              {/* Column 1: QR Code section */}
              <div className="text-center self-center space-y-1">
                <div className="w-12 h-12 border border-slate-200 p-0.5 mx-auto bg-white flex items-center justify-center rounded shadow-sm">
                  {/* High quality vector QR code simulation with a scanner feel */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800">
                    <path d="M5,5 h30 v30 h-30 z M15,15 h10 v10 h-10 z" fill="currentColor" />
                    <path d="M65,5 h30 v30 h-30 z M75,15 h10 v10 h-10 z" fill="currentColor" />
                    <path d="M5,65 h30 v30 h-30 z M15,75 h10 v10 h-10 z" fill="currentColor" />
                    <path d="M45,5 h10 v20 h-10 z M45,35 h10 v10 h-10 z M5,45 h10 v10 h-10 z" fill="currentColor" />
                    <path d="M55,55 h15 v10 h-15 z M75,55 h20 v20 h-20 z" fill="currentColor" />
                    <path d="M45,65 h10 v30 h-10 z M65,85 h20 v10 h-20 z" fill="currentColor" />
                  </svg>
                </div>
                <p className="text-[6px] text-slate-400 font-bold tracking-wider uppercase">ভেরিফিকেশন</p>
              </div>

              {/* Column 2: Member Signature Column */}
              <div className="text-center">
                <div className="h-10 border-b border-dashed border-slate-300 w-20 mx-auto"></div>
                <p className="text-[9px] text-slate-500 mt-1 font-bold">গ্রাহকের স্বাক্ষর</p>
              </div>

              {/* Column 3: Collector Signature Column */}
              <div className="text-center relative">
                {/* Embedded Digital Signature image */}
                <div className="absolute top-[-25px] left-1/2 transform -translate-x-1/2 w-16 h-8 pointer-events-none opacity-90">
                  <img src={settings.signature} alt="Signature" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                {/* Embedded Digital Stamp */}
                <div className="absolute top-[-35px] right-0 w-11 h-11 border border-emerald-600/30 text-emerald-600/30 rounded-full flex items-center justify-center text-[5px] font-bold rotate-12 pointer-events-none select-none">
                  <span className="text-center scale-90">আল-বারাকা<br/>পেইড</span>
                </div>
                
                <div className="h-10 border-b border-dashed border-slate-300 w-22 mx-auto"></div>
                <p className="text-[9px] text-primary mt-1 font-bold">আদায়কারী</p>
                <p className="text-[7px] text-slate-400 leading-none">রশিদ ইস্যুকারী</p>
              </div>

              {/* Column 4: Treasurer Signature Column */}
              <div className="text-center relative">
                {/* Simulated digital ink signature for treasurer in orange color */}
                <div className="absolute top-[-22px] left-1/2 transform -translate-x-1/2 w-16 h-8 pointer-events-none opacity-85">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" className="w-full h-full">
                    <path d="M 10 32 Q 25 15, 45 35 T 85 22 Q 92 18, 70 30" fill="none" stroke="#ea580c" strokeWidth="2.5" />
                    <path d="M 15 28 L 75 28" fill="none" stroke="#ea580c" strokeWidth="1" opacity="0.4" />
                  </svg>
                </div>
                
                <div className="h-10 border-b border-dashed border-slate-300 w-22 mx-auto"></div>
                <p className="text-[9px] text-slate-700 mt-1 font-extrabold">রাকিবুল হাসান (শিপন)</p>
                <p className="text-[7px] text-slate-400 leading-none">কোষাধ্যক্ষ</p>
              </div>

              {/* Column 5: President/Founder Signature Column */}
              <div className="text-center relative">
                {/* Simulated digital ink signature for president in emerald color */}
                <div className="absolute top-[-22px] left-1/2 transform -translate-x-1/2 w-16 h-8 pointer-events-none opacity-85">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" className="w-full h-full">
                    <path d="M 15 35 Q 35 12, 55 35 T 88 24 Q 95 20, 75 28" fill="none" stroke="#047857" strokeWidth="2.5" />
                    <circle cx="55" cy="25" r="2.5" fill="#047857" />
                  </svg>
                </div>
                
                <div className="h-10 border-b border-dashed border-slate-300 w-22 mx-auto"></div>
                <p className="text-[9px] text-slate-700 mt-1 font-extrabold">প্রকৌশলী মোঃ তানভীন</p>
                <p className="text-[7px] text-slate-400 leading-none">সভাপতি</p>
              </div>
            </div>

            {/* Fine print stamp footer */}
            <div className="text-center text-[9px] text-slate-400 font-medium mt-10 border-t border-dashed border-slate-100 pt-2.5">
              এটি একটি কম্পিউটার জেনারেটেড রশিদ এবং এতে কোনো ম্যানুয়াল স্বাক্ষরের প্রয়োজন নেই। সফলভাবে সংরক্ষিত আল-বারাকা ট্রাস্ট ডাটাবেজ।
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-100 shadow-sm">
          রশিদ দেখানোর জন্য আগে কোনো পেমেন্ট সিলেক্ট করুন বা পেমেন্ট এন্ট্রি করুন।
        </div>
      )}
    </div>
  );
}
