/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SystemSettings } from '../types';
import { generateGoogleAppsScript } from '../utils';
import { FileCode, Clipboard, Check, HelpCircle } from 'lucide-react';

interface GoogleAppsScriptSheetProps {
  settings: SystemSettings;
}

export default function GoogleAppsScriptSheet({ settings }: GoogleAppsScriptSheetProps) {
  const [copied, setCopied] = useState(false);
  const scriptCode = generateGoogleAppsScript(settings);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <FileCode className="text-gold" />
            গুগল অ্যাপস স্ক্রিপ্ট (Google Apps Script Tool)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            আপনার গুগল শিটস (Google Sheets) এ রশিদ অটোমেশন, পিডিএফ ড্রাইভ সেভিং এবং হোয়াটসঅ্যাপ শেয়ারিং অ্যাক্টিভেট করার কোড।
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="px-4 py-2.5 bg-primary hover:bg-primary-light text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          {copied ? <Check size={14} className="text-gold" /> : <Clipboard size={14} />}
          {copied ? 'কপি সম্পন্ন!' : 'কোড কপি করুন (Copy Code)'}
        </button>
      </div>

      {/* Grid: Instructions vs Code Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step by Step Instructions (Left Column) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-bold text-sm text-primary border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <HelpCircle size={16} className="text-gold" />
            কোড ব্যবহারের নিয়মাবলী
          </h3>
          
          <ol className="text-xs text-slate-600 space-y-3.5 list-decimal pl-4 leading-relaxed">
            <li>
              প্রথমে আমাদের ওয়েব অ্যাপ থেকে আপনার ডাটাবেজটি <strong className="text-primary">Excel (.xlsx)</strong> ফরম্যাটে ডাউনলোড করুন (যেকোনো শিটের উপরে থাকা এক্সপোর্ট বাটনে ক্লিক করে)।
            </li>
            <li>
              আপনার <strong className="text-primary">Google Drive</strong> এ যান এবং ডাউনলোডকৃত এক্সেল ফাইলটি আপলোড করে <strong className="text-emerald-700">Google Sheets</strong> হিসেবে ওপেন করুন।
            </li>
            <li>
              গুগল শিটের ওপরের মেনু থেকে <strong className="text-slate-800">Extensions &gt; Apps Script</strong> এ ক্লিক করুন।
            </li>
            <li>
              সেখানে আগের সব কোড মুছে দিয়ে ডানদিকের সম্পূর্ণ কোডটি কপি করে পেস্ট করুন।
            </li>
            <li>
              ওপরের <strong className="text-slate-800">Save (সেভ)</strong> আইকনটিতে ক্লিক করুন।
            </li>
            <li>
              গুগল শিটটি একবার রিলোড (Reload) করুন। রিলোড হওয়ার পর শিটের ওপরের ডানদিকে <strong className="text-primary">"Al-Baraka Automation"</strong> নামে একটি নতুন মেনু অপশন দেখতে পাবেন।
            </li>
            <li>
              লেনদেনের যেকোনো রো (Row) সিলেক্ট করে ঐ মেনু থেকে <strong className="text-primary">"Generate Receipt PDF"</strong> এ ক্লিক করলে গুগলের সিকিউরিটি পারমিশন চাবে, তা অনুমোদন করুন।
            </li>
            <li>
              অনুমোদন সফল হলে স্বয়ংক্রিয়ভাবে ঐ রো-এর সদস্যের জন্য একটি পিডিএফ রশিদ তৈরি হয়ে আপনার গুগল ড্রাইভে <strong className="text-emerald-800">"Al-Baraka Receipts"</strong> নামক ফোল্ডারে সেভ হয়ে যাবে এবং রশিদের শেয়ারিং লিংকটি Column J তে বসে যাবে।
            </li>
          </ol>
        </div>

        {/* Script Code Viewer (Right Column) */}
        <div className="bg-slate-900 p-5 rounded-2xl shadow-md lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono font-bold px-2 py-0.5 rounded">
                Code.gs
              </span>
              <span className="text-[10px] text-gold font-mono">
                ১০০% গুগল ড্রাইভ ও শিট কমপ্যাটিবল
              </span>
            </div>
            
            <pre className="text-[11px] text-slate-300 font-mono overflow-y-auto max-h-[350px] p-2 leading-relaxed whitespace-pre scrollbar-thin">
              {scriptCode}
            </pre>
          </div>

          <div className="border-t border-slate-800 pt-3 mt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>ফাইলের নাম: Code.gs</span>
            <button 
              onClick={handleCopy}
              className="text-gold hover:underline cursor-pointer"
            >
              কপি করতে ক্লিক করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
