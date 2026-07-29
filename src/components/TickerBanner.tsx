/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Bell, AlertTriangle, Eye, ChevronRight } from 'lucide-react';
import { audioSynth } from '../utils/audio';

export interface TickerItem {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'General' | 'Urgent' | 'Meeting' | 'Bank' | 'Deposit';
  isUrgent?: boolean;
}

interface TickerBannerProps {
  items: TickerItem[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectItem: (item: TickerItem) => void;
}

export default function TickerBanner({
  items,
  soundEnabled,
  onToggleSound,
  onSelectItem
}: TickerBannerProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Fallback ticker items if list is empty
  const defaultItems: TickerItem[] = [
    {
      id: 't-1',
      title: 'মাসিক সঞ্চয় জমা সংক্রান্ত জরুরি নোটিশ',
      content: 'আল-বারাকা ভূমি প্রকল্পের সকল সম্মানিত সদস্যদের অবগতির জন্য জানানো যাচ্ছে যে, ২০২৬ সালের সকল চলতি মাসের সঞ্চয় (২,০০০ টাকা) ও ফি যথাসময়ে জনতা ব্যাংক ময়মনসিংহ শাখায় জমা করার জন্য বলা হচ্ছে।',
      date: '2026-02-01',
      category: 'Urgent',
      isUrgent: true
    },
    {
      id: 't-2',
      title: 'প্রকল্পের ব্যাংক হিসাব ও ট্রান্সপারেন্সি',
      content: 'ব্যাংক হিসাব: জনতা ব্যাংক পিএলসি, ময়মনসিংহ শাখা, হিসাব নং: ০১০০২৯৪২৭৮৫৫৩ (তিনজন যৌথ পরিচালকের স্বাক্ষরে পরিচালিত)। সকল জমার হিসাব "ব্যাংক ডিপোজিট" ট্যাবে দেখুন।',
      date: '2026-02-01',
      category: 'Bank',
      isUrgent: false
    }
  ];

  const displayItems = items.length > 0 ? items : defaultItems;

  return (
    <div className="bg-slate-900 text-white border-b border-amber-500/30 shadow-sm no-print relative z-10">
      <div className="max-w-7xl mx-auto flex items-stretch overflow-hidden text-xs font-sans">
        
        {/* Ticker Fixed Header Tag */}
        <div className="bg-amber-500 text-slate-950 px-3 py-2 font-extrabold flex items-center justify-center gap-1.5 shrink-0 shadow-md select-none z-10" title="জরুরি ঘোষণা ও নোটিশ">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
          </span>
          <Bell size={15} className="animate-bounce text-slate-950" />
        </div>

        {/* Scrolling Marquee Container */}
        <div 
          className="flex-1 overflow-hidden relative flex items-center bg-slate-950/60 py-1.5 cursor-pointer"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className={`whitespace-nowrap flex items-center gap-8 ${
              isPaused ? '[animation-play-state:paused]' : ''
            }`}
            style={{
              display: 'inline-flex',
              animation: 'marquee 38s linear infinite'
            }}
          >
            {/* Render 2 identical loops to ensure continuous smooth infinite marquee */}
            {[...displayItems, ...displayItems].map((item, idx) => (
              <div 
                key={`${item.id}-${idx}`}
                onClick={() => onSelectItem(item)}
                className="inline-flex items-center gap-2 hover:text-amber-400 transition-colors group px-2 py-0.5 rounded hover:bg-white/5"
              >
                {item.category === 'Urgent' || item.isUrgent ? (
                  <span className="bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={10} /> জরুরি
                  </span>
                ) : item.category === 'Bank' ? (
                  <span className="bg-sky-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    🏦 ব্যাংক তথ্য
                  </span>
                ) : (
                  <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    📢 ঘোষণা
                  </span>
                )}

                <span className="font-semibold text-slate-200 group-hover:text-amber-300">
                  {item.title}:
                </span>
                <span className="text-slate-300 font-light truncate max-w-md">
                  {item.content}
                </span>

                <span className="text-[10px] text-amber-400/80 underline font-medium flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={11} /> বিস্তারিত
                </span>

                <span className="text-slate-600 ml-4">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* End Scrolling Container */}

      </div>

      {/* Tailwind CSS Marquee Animation Keyframes injected */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
