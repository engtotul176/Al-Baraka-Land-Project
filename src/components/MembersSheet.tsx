/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Member } from '../types';
import { toBanglaDigits } from '../utils';
import { Search, UserPlus, Edit2, Check, X, ShieldAlert, FileSpreadsheet, Eye, UserX } from 'lucide-react';

interface MembersSheetProps {
  members: Member[];
  onAddMember: (member: Member) => void;
  onUpdateMember: (member: Member) => void;
  onSelectTab: (tab: string) => void;
  onSelectMemberLedger: (memberId: string) => void;
  isAdmin?: boolean;
}

export default function MembersSheet({
  members,
  onAddMember,
  onUpdateMember,
  onSelectTab,
  onSelectMemberLedger,
  isAdmin = true
}: MembersSheetProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Form State
  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [nid, setNid] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [profession, setProfession] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [nominee, setNominee] = useState('');
  const [nomineeMobile, setNomineeMobile] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [remarks, setRemarks] = useState('');

  // Handle Edit click
  const startEdit = (m: Member) => {
    setEditingMemberId(m.memberId);
    setMemberId(m.memberId);
    setName(m.name);
    setFatherName(m.fatherName);
    setMotherName(m.motherName);
    setMobile(m.mobile);
    setWhatsapp(m.whatsapp);
    setNid(m.nid);
    setBirthDate(m.birthDate);
    setAddress(m.address);
    setProfession(m.profession);
    setJoiningDate(m.joiningDate);
    setNominee(m.nominee);
    setNomineeMobile(m.nomineeMobile);
    setStatus(m.status);
    setRemarks(m.remarks);
    setShowAddForm(true);
  };

  // Reset Form
  const resetForm = () => {
    setEditingMemberId(null);
    setMemberId('');
    setName('');
    setFatherName('');
    setMotherName('');
    setMobile('');
    setWhatsapp('');
    setNid('');
    setBirthDate('');
    setAddress('');
    setProfession('');
    setJoiningDate('');
    setNominee('');
    setNomineeMobile('');
    setStatus('Active');
    setRemarks('');
    setShowAddForm(false);
  };

  // Generate a recommended Member ID based on highest existing number
  const openNewForm = () => {
    resetForm();
    let maxId = 0;
    members.forEach(m => {
      const match = m.memberId.match(/AB-(\d+)/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > maxId) maxId = val;
      }
    });
    const nextId = `AB-${String(maxId + 1).padStart(2, '0')}`;
    setMemberId(nextId);
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId.trim() || !name.trim() || !mobile.trim()) {
      alert("সদস্য আইডি, নাম এবং মোবাইল নম্বর অবশ্যই দিতে হবে!");
      return;
    }

    const payload: Member = {
      memberId: memberId.trim(),
      name: name.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim() || `+88${mobile.trim()}`,
      nid: nid.trim(),
      birthDate: birthDate,
      address: address.trim(),
      profession: profession.trim(),
      joiningDate: joiningDate,
      nominee: nominee.trim(),
      nomineeMobile: nomineeMobile.trim() || mobile.trim(),
      status,
      remarks: remarks.trim()
    };

    if (editingMemberId) {
      // Check if trying to edit ID to an existing one that is NOT this member
      if (editingMemberId !== memberId && members.some(m => m.memberId === memberId)) {
        alert("ভুল! এই সদস্য আইডিটি ইতিমধ্যে অন্য কোনো সদস্যের জন্য ব্যবহার করা হয়েছে।");
        return;
      }
      onUpdateMember(payload);
      alert("সদস্য তথ্য সফলভাবে আপডেট করা হয়েছে!");
    } else {
      // Check duplicate ID
      if (members.some(m => m.memberId === memberId)) {
        alert("ভুল! এই সদস্য আইডিটি ইতিমধ্যে ডাটাবেজে রয়েছে। অনুগ্রহ করে অন্য আইডি দিন বা এটি ম্যানুয়ালি এডিট করুন।");
        return;
      }
      onAddMember(payload);
      alert("নতুন সদস্য সফলভাবে ডাটাবেজে যুক্ত করা হয়েছে!");
    }
    resetForm();
  };

  // Filter Members based on search query
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.mobile.includes(searchQuery) ||
    m.profession.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <FileSpreadsheet className="text-gold" />
            সদস্য ডাটাবেজ (Members Database)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            এখানে আপনার প্রকল্পের সকল সদস্যের সম্পূর্ণ তালিকা ও প্রোফাইল সংরক্ষিত রয়েছে।
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={showAddForm ? resetForm : openNewForm}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              showAddForm 
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                : 'bg-primary text-white hover:bg-primary-light border border-primary'
            }`}
          >
            {showAddForm ? <X size={16} /> : <UserPlus size={16} />}
            {showAddForm ? 'ফরম বন্ধ করুন' : 'নতুন সদস্য যুক্ত করুন'}
          </button>
        )}
      </div>

      {/* Dynamic Member Add/Edit Form Box */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border-l-4 border-gold shadow-sm space-y-4 animate-fade-in">
          <h3 className="font-bold text-primary text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-gold" />
            {editingMemberId ? 'সদস্যের তথ্য পরিবর্তন করুন (সম্পাদনা)' : 'নতুন সদস্যের তথ্য ফরম (ম্যানুয়াল এন্ট্রি)'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Field 1: Member ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">সদস্য আইডি (ম্যানুয়ালি এডিটেবল)*</label>
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="যেমন: AB-01"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono font-semibold"
                required
              />
            </div>

            {/* Field 2: Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">সদস্যের নাম (বাংলা)*</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="সদস্যের পুরো নাম"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Field 3: Father's Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">পিতার নাম</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="পিতার নাম"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Field 4: Mother's Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মাতার নাম</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="মাতার নাম"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Field 5: Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মোবাইল নম্বর*</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="যেমন: 017xxxxxxxx"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
                required
              />
            </div>

            {/* Field 6: Whatsapp */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">হোয়াটসঅ্যাপ নম্বর (কান্ট্রি কোড সহ)</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="যেমন: +88017xxxxxxxx"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Field 7: NID */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">জাতীয় পরিচয়পত্র নম্বর (NID)</label>
              <input
                type="text"
                value={nid}
                onChange={(e) => setNid(e.target.value)}
                placeholder="এনআইডি নম্বর"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Field 8: Birth Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">জন্ম তারিখ</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Field 9: Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ঠিকানা</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="বর্তমান ও স্থায়ী ঠিকানা"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Field 10: Profession */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">পেশা</label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="যেমন: প্রকৌশলী, ব্যবসায়ী"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Field 11: Joining Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">যোগদানের তারিখ</label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Field 12: Nominee */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">মনোনীত উত্তরাধিকারী (Nominee)</label>
              <input
                type="text"
                value={nominee}
                onChange={(e) => setNominee(e.target.value)}
                placeholder="নমিনির নাম"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Field 13: Nominee Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">নমিনির মোবাইল নম্বর</label>
              <input
                type="text"
                value={nomineeMobile}
                onChange={(e) => setNomineeMobile(e.target.value)}
                placeholder="নমিনির ফোন নম্বর"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Field 14: Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">সদস্য স্ট্যাটাস</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white"
              >
                <option value="Active">সক্রিয় (Active)</option>
                <option value="Inactive">নিষ্ক্রিয় (Inactive)</option>
              </select>
            </div>

            {/* Field 15: Remarks */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">মন্তব্য (Remarks)</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="সদস্য সম্পর্কে অতিরিক্ত তথ্য"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              বাতিল করুন
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-light text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <Check size={14} />
              {editingMemberId ? 'তথ্য সংরক্ষণ করুন' : 'ডাটাবেজে যুক্ত করুন'}
            </button>
          </div>
        </form>
      )}

      {/* Database Search & Statistics Grid */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="সদস্য আইডি, নাম, মোবাইল বা পেশা দিয়ে সার্চ করুন..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-slate-50/50 focus:bg-white"
            />
          </div>
          {/* Summary Indicator */}
          <div className="text-xs text-slate-500 font-medium">
            মোট রেকর্ড পাওয়া গেছে: <span className="text-primary font-bold">{toBanglaDigits(filteredMembers.length)} জন</span> / {toBanglaDigits(members.length)} জন
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[500px]">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            {/* Table Header (Freeze Pane effect using sticky class) */}
            <thead>
              <tr className="bg-primary text-white text-xs font-semibold sticky top-0 shadow-sm z-10">
                <th className="p-3.5 border-b border-primary-light text-center w-20">অ্যাকশন</th>
                <th className="p-3.5 border-b border-primary-light text-center w-24">আইডি</th>
                <th className="p-3.5 border-b border-primary-light">সদস্যের নাম</th>
                <th className="p-3.5 border-b border-primary-light">পিতার নাম</th>
                <th className="p-3.5 border-b border-primary-light">মোবাইল নম্বর</th>
                <th className="p-3.5 border-b border-primary-light">হোয়াটসঅ্যাপ</th>
                <th className="p-3.5 border-b border-primary-light">পেশা</th>
                <th className="p-3.5 border-b border-primary-light text-center">স্ট্যাটাস</th>
                <th className="p-3.5 border-b border-primary-light">জাতীয় পরিচয়পত্র (NID)</th>
                <th className="p-3.5 border-b border-primary-light">মনোনীত ব্যক্তি</th>
                <th className="p-3.5 border-b border-primary-light">মন্তব্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => (
                  <tr key={m.memberId} className="hover:bg-slate-50 transition-colors">
                    {/* Action buttons */}
                    <td className="p-3 text-center flex items-center justify-center gap-1.5">
                      {isAdmin && (
                        <button
                          onClick={() => startEdit(m)}
                          title="সম্পাদনা করুন"
                          className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onSelectMemberLedger(m.memberId);
                          onSelectTab('ledger');
                        }}
                        title="লেজার খতিয়ান দেখুন"
                        className="p-1.5 text-slate-500 hover:text-gold hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                    
                    {/* Member ID */}
                    <td className="p-3 text-center font-bold text-primary font-mono">{m.memberId}</td>
                    
                    {/* Member Name */}
                    <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                    
                    {/* Father Name */}
                    <td className="p-3 text-slate-500">{m.fatherName}</td>
                    
                    {/* Mobile */}
                    <td className="p-3 font-mono">{toBanglaDigits(m.mobile)}</td>
                    
                    {/* Whatsapp */}
                    <td className="p-3 font-mono">{toBanglaDigits(m.whatsapp)}</td>
                    
                    {/* Profession */}
                    <td className="p-3">{m.profession || '―'}</td>
                    
                    {/* Status badge */}
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {m.status === 'Active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                    
                    {/* NID */}
                    <td className="p-3 font-mono text-slate-500">{toBanglaDigits(m.nid)}</td>
                    
                    {/* Nominee */}
                    <td className="p-3">
                      <div>{m.nominee || '―'}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{m.nomineeMobile ? toBanglaDigits(m.nomineeMobile) : ''}</span>
                    </td>
                    
                    {/* Remarks */}
                    <td className="p-3 text-slate-500 max-w-[150px] truncate" title={m.remarks}>{m.remarks || '―'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400">
                    কোনো সদস্যের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
