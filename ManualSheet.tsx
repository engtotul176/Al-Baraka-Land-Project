/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileQuestion, Landmark, ShieldCheck, Database, CloudUpload, Sparkles } from 'lucide-react';

export default function ManualSheet() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <FileQuestion className="text-gold" />
          ব্যবহারকারী সহায়িকা ও নির্দেশিকা (User Manual & Help Guide)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          আল-বারাকা স্মার্ট ম্যানেজমেন্ট সিস্টেমের সকল খাতের বিস্তারিত বিবরণ এবং ডাটা রিস্টোর-ব্যাকআপ গাইডলাইন।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Manual Content Area (Left/Center) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 space-y-6">
          <h3 className="font-bold text-base text-primary flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sparkles size={18} className="text-gold" />
            সিস্টেমের বিভিন্ন মডিউলসমূহের বিবরণ
          </h3>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            {/* 1. Dashboard */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                ১. ড্যাশবোর্ড (Dashboard)
              </h4>
              <p>
                এটি হচ্ছে সফটওয়্যারটির মূল নিয়ন্ত্রণ প্যানেল। এখানে প্রবেশ করলেই প্রকল্পের মোট সদস্য সংখ্যা, সংগৃহীত সর্বমোট আমানত ফান্ড, চলতি মাসের আদায়, ব্যাংকে জমাকৃত ব্যালেন্স, ক্যাশ ইন হ্যান্ড ফান্ড এবং চলতি মাসের বকেয়া সদস্যের সংখ্যা রিয়েল-টাইমে দেখতে পাবেন। নিচে একটি ভিজ্যুয়াল বার চার্ট রয়েছে যা আপনার প্রকল্পের গত ৬ মাসের প্রবৃদ্ধি এবং আদায় চিত্র ফুটিয়ে তোলে।
              </p>
            </div>

            {/* 2. Members Database */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                ২. সদস্য ডাটাবেজ (Members Database)
              </h4>
              <p>
                প্রকল্পের সকল সদস্যদের তথ্য এখানে জমা থাকে। নতুন কোনো ব্যক্তি সদস্য হিসেবে যুক্ত হলে "নতুন সদস্য যুক্ত করুন" বাটনে ক্লিক করে তার নাম, পিতার নাম, মোবাইল, হোয়াটসঅ্যাপ, জাতীয় পরিচয়পত্র (NID) নম্বর ইত্যাদি দিয়ে ডাটাবেজে যুক্ত করতে পারবেন। সদস্যদের আইডিগুলো ম্যানুয়ালি এডিটেবল, ফলে আপনি চাইলে নিজের পছন্দমত আইডি ফরম্যাট সেট করতে পারবেন।
              </p>
            </div>

            {/* 3. Payment Entry */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                ৩. আদায় ফরম এন্ট্রি (Payment Entry)
              </h4>
              <p>
                কোনো সদস্য মাসিক সঞ্চয়, রেজিস্ট্রেশন ফি, মিটিং ফি বা জরিমানা প্রদান করলে এই ফরমে এসে এন্ট্রি করা হয়। সদস্য সিলেক্ট করলেই স্বয়ংক্রিয়ভাবে তার মোবাইল এবং পূর্বের বকেয়া হিসাব লোড হয়ে যায়। রশিদ নম্বরটি প্রতি বছর অনুযায়ী অনন্য উপায়ে স্বয়ংক্রিয়ভাবে তৈরি হয় (যেমন: AB-2026-0001)। একই সদস্যকে এক মাসে একই খাতে দুবার এন্ট্রি করতে গেলে সফটওয়্যারটি আপনাকে "ডুপ্লিকেট পেমেন্ট সতর্কতা" দেখাবে।
              </p>
            </div>

            {/* 4. Receipt */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                ৪. প্রাপ্তির রশিদ (Receipt Viewer)
              </h4>
              <p>
                পেমেন্ট দেওয়ার সাথে সাথে একটি প্রফেশনাল ডিজিটাল মেমো বা রশিদ তৈরি হয়। এই রশিদে প্রকল্পের লোগো, প্রতিষ্ঠাতার পোর্ট্রেট ছবি, ডিজিটাল পেইড সিল এবং আপনার কাস্টম ডিজিটাল স্বাক্ষর যুক্ত থাকে। এছাড়াও টাকা কত তা স্বয়ংক্রিয়ভাবে বাংলায় রূপান্তর করে নেয় (যেমন: দুই হাজার টাকা মাত্র)। রশিদটি সরাসরি প্রিন্ট বা এক ক্লিকে পিডিএফ ডাউনলোড করতে পারবেন এবং হোয়াটসঅ্যাপে শেয়ার বাটনে ক্লিক করে সদস্যকে মোবাইলে পাঠিয়ে দিতে পারবেন।
              </p>
            </div>

            {/* 5. Bank Deposit */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                ৫. ব্যাংক ডিপোজিট রেজিস্টার (Bank Deposit)
              </h4>
              <p>
                ক্যাশ ইন হ্যান্ড বা হাতে থাকা নগদ টাকা ব্যাংকে জমা দেওয়ার হিসেব রাখার জন্য এই মডিউলটি ব্যবহৃত হয়। এখানে ব্যাংকের নাম, শাখা, আমানতের পরিমাণ, স্লিপ নম্বর ইত্যাদি লিখে সাবমিট করলেই ড্যাশবোর্ডের "ব্যাংক ব্যালেন্স" স্বয়ংক্রিয়ভাবে বৃদ্ধি পায় এবং "ক্যাশ ইন হ্যান্ড" কমে গিয়ে ব্যালেন্স সমন্বয় করে।
              </p>
            </div>

            {/* 6. Member Ledger */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                ৬. সদস্য ব্যক্তিগত খতিয়ান (Member Ledger)
              </h4>
              <p>
                কোনো নির্দিষ্ট সদস্য আজ পর্যন্ত কোন খাতে কত টাকা দিয়েছেন এবং তার কোন খাতে কত বকেয়া আছে তা এক পলকে দেখার জন্য খতিয়ান সাহায্য করে। সদস্য সিলেক্ট করলেই তার সম্পূর্ণ পরিশোধিত ফান্ডের বিবরণী চলে আসবে এবং খতিয়ান মেমোটি প্রিন্ট করার অপশন পাওয়া যাবে।
              </p>
            </div>

            {/* 7. Reports */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-gold"></span>
                ৭. মাসিক, বার্ষিক ও বকেয়া রিপোর্ট (Reports)
              </h4>
              <p>
                প্রকল্পের আর্থিক অডিট করার জন্য রিপোর্ট সাহায্য করে। মাস সিলেক্ট করলে ঐ মাসের মোট আদায় ও খাতওয়ারি বিবরণী চলে আসে। বার্ষিক রিপোর্টে বছরের ১২ মাসের তুলনামূলক চিত্র প্রদর্শিত হয়। বকেয়া রিপোর্টে যেকোনো নির্দিষ্ট মাসে কোন কোন সদস্য মাসিক সঞ্চয় জমা দিতে ব্যর্থ হয়েছেন তাদের নামের তালিকা, আইডি এবং মোবাইল নম্বর স্বয়ংক্রিয়ভাবে লোড হয়ে যাবে।
              </p>
            </div>
          </div>
        </div>

        {/* Data Security, Drive Sync and Backup-Restore (Right Column) */}
        <div className="space-y-6">
          {/* Backup Restore Info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Database size={16} className="text-gold" />
              ডাটা ব্যাকআপ ও রিস্টোর গাইড
            </h3>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>১. ব্যাকআপ ডাউনলোড:</strong> আপনার ডাটা ব্রাউজারের লোকাল স্টোরেজে সুরক্ষিত থাকে। ব্রাউজার ক্যাশ ক্লিন করার পূর্বে অবশ্যই <strong className="text-primary">"Settings (সেটিংস)"</strong> ট্যাবে যান এবং <strong className="text-primary">"ব্যাকআপ ফাইল ডাউনলোড"</strong> বাটনে ক্লিক করুন। এতে একটি <code>.json</code> ফাইল আপনার কম্পিউটারে সেভ হবে।
              </p>
              <p>
                <strong>২. ডাটা রিস্টোর:</strong> ক্যাশ ক্লিন হয়ে গেলে বা অন্য কম্পিউটারে ডাটা নিতে চাইলে সেটিংসে গিয়ে <strong className="text-rose-700">"ব্যাকআপ রিস্টোর করুন"</strong> এ ক্লিক করুন এবং পূর্বে ডাউনলোডকৃত <code>.json</code> ফাইলটি সিলেক্ট করলেই চোখের পলকে সব ডাটা ফিরে আসবে।
              </p>
            </div>
          </div>

          {/* Cloud upload / Google Drive & Sheets integration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <CloudUpload size={16} className="text-gold" />
              গুগল ড্রাইভ ও শিট গাইডলাইন
            </h3>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>১. এক্সেল ডাউনলোড:</strong> সফটওয়্যারের ওপরে থাকা <strong className="text-emerald-800">"Export to Excel (.xlsx)"</strong> বাটনে ক্লিক করলেই আপনার সম্পূর্ণ ডাটাবেজ একটি সুন্দর মাল্টি-শিট এক্সেলে ডাউনলোড হবে।
              </p>
              <p>
                <strong>২. গুগল ড্রাইভে আপলোড:</strong> গুগল ড্রাইভে লগইন করে নতুন ফাইল আপলোড হিসেবে ডাউনলোডকৃত এক্সেলে ফাইলটি সিলেক্ট করুন। ফাইল আপলোড সম্পন্ন হলে ক্লিক করে "Open with Google Sheets" এ ক্লিক করুন।
              </p>
              <p>
                <strong>৩. গুগল শিট রুলস:</strong> আমাদের এক্সেল জেনারেটর কোনো ম্যাক্রো বা VBA কোড ব্যবহার করে না। তাই এটি গুগল শিটের সাথে শতভাগ সামঞ্জস্যপূর্ণ। কোনো ফর্মুলা ভেঙে যায় না।
              </p>
            </div>
          </div>

          {/* Privacy & Safety */}
          <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 space-y-3 text-xs text-emerald-900">
            <h4 className="font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-gold" />
              ব্যক্তিগত ডাটা নিরাপত্তা সতর্কতা
            </h4>
            <p className="leading-relaxed">
              এই সিস্টেমের সকল ডাটা সম্পূর্ণ প্রাইভেসী-বান্ধব। ডাটা কোনো ক্লাউড সার্ভারে পাঠানো হয় না, ফলে হ্যাকিংয়ের কোনো ভয় নেই। আপনার ডাটা সম্পূর্ণ আপনার ডিভাইসে সুরক্ষিত রয়েছে। সর্বদা সপ্তাহ শেষে বা কাজ শেষে একটি ডাউনলোড ব্যাকআপ ফাইল সংরক্ষণ করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
