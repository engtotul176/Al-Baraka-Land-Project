/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Megaphone, X, Calendar, Bell, Volume2, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { toBanglaDigits } from '../utils';
import { audioSynth } from '../utils/audio';

export interface PopUpNoticeData {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'General' | 'Urgent' | 'Meeting' | 'Bank' | 'Deposit';
}

interface PopUpNoticeModalProps {
  notice: PopUpNoticeData | null;
  isOpen: boolean;
  soundEnabled: boolean;
  onClose: () => void;
  onDismissForever?: () => void;
  onGoToNoticeBoard?: () => void;
}

export default function PopUpNoticeModal({
  notice,
  isOpen,
  soundEnabled,
  onClose,
  onDismissForever,
  onGoToNoticeBoard
}: PopUpNoticeModalProps) {
  useEffect(() => {
    if (isOpen && notice && soundEnabled) {
      if (notice.category === 'Urgent') {
        audioSynth.playUrgentAlert();
      } else {
        audioSynth.playChime();
      }
    }
  }, [isOpen, notice, soundEnabled]);

  if (!isOpen || !notice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn no-print">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-amber-500/40 overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className={`p-5 text-white flex items-center justify-between ${
          notice.category === 'Urgent' 
            ? 'bg-gradient-to-r from-rose-700 to-rose-900 border-b-4 border-rose-400' 
            : notice.category === 'Bank'
            ? 'bg-gradient-to-r from-sky-800 to-sky-950 border-b-4 border-sky-400'
            : 'bg-gradient-to-r from-emerald-800 to-emerald-950 border-b-4 border-gold'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 animate-bounce">
              {notice.category === 'Urgent' ? <AlertTriangle size={22} className="text-amber-300" /> : <Bell size={22} className="text-gold" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded-full text-amber-200">
                {notice.category === 'Urgent' ? '⚠️ জরুরি বিজ্ঞপ্তি অ্যালার্ট' : '📢 লাইভ অ্যালার্ট আপডেট'}
              </span>
              <h3 className="text-lg font-bold mt-0.5 leading-snug">
                আল-বারাকা অফিশিয়াল নোটিশ
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer border-0"
            title="বন্ধ করুন"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notice Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-mono text-slate-500 flex items-center gap-1.5 font-medium">
              <Calendar size={13} className="text-amber-600" />
              প্রকাশের তারিখ: {toBanglaDigits(notice.date)}
            </span>

            {soundEnabled && (
              <button
                onClick={() => {
                  if (notice.category === 'Urgent') audioSynth.playUrgentAlert();
                  else audioSynth.playChime();
                }}
                className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200/60 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Volume2 size={13} />
                সাউন্ড শোনেন
              </button>
            )}
          </div>

          <div>
            <h4 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
              {notice.title}
            </h4>
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap max-h-60 overflow-y-auto">
              {notice.content}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span>সকল সদস্যদের নির্দিষ্ট সময়ের মধ্যে প্রয়োজনীয় সঞ্চয় ও ফি পরিশোধের অনুরোধ করা হচ্ছে।</span>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2">
          {onDismissForever ? (
            <button
              onClick={onDismissForever}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline cursor-pointer order-2 sm:order-1"
            >
              আজকে আর দেখাবেন না
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            {onGoToNoticeBoard && (
              <button
                onClick={() => {
                  onClose();
                  onGoToNoticeBoard();
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer border-0 shadow-sm"
              >
                নোটিশ বোর্ডে যান
                <ArrowRight size={13} />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border-0 shadow-sm"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
