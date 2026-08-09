/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member, Payment, BankDeposit, SystemSettings } from './types';
import * as XLSX from 'xlsx';

// English to Bangla Digits
export function toBanglaDigits(num: string | number): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

// Get Today's Date dynamically in Bangla
export function getTodayBanglaDate(): string {
  const date = new Date();
  const day = date.getDate();
  const monthsBangla = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const month = monthsBangla[date.getMonth()];
  const year = date.getFullYear();
  return `${toBanglaDigits(day)} ${month}, ${toBanglaDigits(year)}`;
}

// Calculate elapsed active months for monthly deposit calculation starting strictly from August 2026
export function getElapsedMonthsFromAugust2026(targetDate: Date = new Date()): number {
  const startYear = 2026;
  const startMonth = 7; // August is 0-indexed month 7 (August 2026)
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth();
  
  if (currentYear < startYear || (currentYear === startYear && currentMonth < startMonth)) {
    return 1;
  }
  
  const months = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
  return Math.max(1, months);
}

// Backward compatibility alias
export const getElapsedMonthsFromJuly2026 = getElapsedMonthsFromAugust2026;

// Format currency in Bangla theme
export function formatCurrencyBangla(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  return `${toBanglaDigits(formatted)} ৳`;
}

// Bangla Number to Words Converter
export function toBanglaWords(num: number): string {
  if (num === 0) return 'শূন্য টাকা মাত্র';

  const singleDigits = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
  const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const tenPart = Math.floor(n / 10);
    const singlePart = n % 10;
    return tens[tenPart] + (singlePart > 0 ? ' ' + singleDigits[singlePart] : '');
  }

  let words = '';

  const crore = Math.floor(num / 10000000);
  let remaining = num % 10000000;

  const lakh = Math.floor(remaining / 100000);
  remaining = remaining % 100000;

  const thousand = Math.floor(remaining / 1000);
  remaining = remaining % 1000;

  const hundred = Math.floor(remaining / 100);
  remaining = remaining % 100;

  if (crore > 0) {
    words += toBanglaWords(crore).replace(' টাকা মাত্র', '') + ' কোটি ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' লক্ষ্য ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' হাজার ';
  }
  if (hundred > 0) {
    words += convertTwoDigits(hundred) + ' শত ';
  }
  if (remaining > 0) {
    words += convertTwoDigits(remaining);
  }

  return words.trim() + ' টাকা মাত্র';
}

// Generate next unique receipt number
export function generateNextReceiptNo(payments: Payment[], year: number): string {
  const yearPayments = payments.filter(p => p.year === year);
  let maxSeq = 0;
  
  const regex = new RegExp(`AB-${year}-(\\d{4})`);
  yearPayments.forEach(p => {
    const match = p.receiptNo.match(regex);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  });

  const nextSeq = maxSeq + 1;
  return `AB-${year}-${String(nextSeq).padStart(4, '0')}`;
}

// Export workbook state to real Microsoft Excel (.xlsx) file
export function exportToExcel(
  members: Member[],
  payments: Payment[],
  bankDeposits: BankDeposit[],
  settings: SystemSettings
) {
  const wb = XLSX.utils.book_new();

  // 1. Settings Sheet
  const settingsData = [
    ["Organization Details / তথ্য", ""],
    ["Organization Name / নাম", settings.orgName],
    ["Slogan / স্লোগান", settings.orgSlogan],
    ["Mobile / মোবাইল", settings.orgMobile],
    ["Email / ইমেইল", settings.orgEmail],
    ["Address / ঠিকানা", settings.orgAddress],
    ["Founder Name / প্রতিষ্ঠাতা", settings.founderName],
    ["Founder Mobile / মোবাইল", settings.founderMobile],
    ["Monthly Amount / মাসিক সঞ্চয়", settings.monthlyAmount],
    ["Registration Fee / রেজিস্ট্রেশন ফি", settings.registrationFee],
    ["Meeting Fee / মিটিং ফি", settings.meetingFee],
    ["Fine / জরিমানা", settings.fine]
  ];
  const wsSettings = XLSX.utils.aoa_to_sheet(settingsData);
  XLSX.utils.book_append_sheet(wb, wsSettings, "Settings");

  // 2. Members Database Sheet
  const membersHeaders = [
    "Member ID", "Member Name", "Father Name", "Mother Name", "Mobile", 
    "Whatsapp", "NID", "Birth Date", "Address", "Profession", 
    "Joining Date", "Nominee", "Nominee Mobile", "Status", "Remarks"
  ];
  const membersRows = members.map(m => [
    m.memberId, m.name, m.fatherName, m.motherName, m.mobile,
    m.whatsapp, m.nid, m.birthDate, m.address, m.profession,
    m.joiningDate, m.nominee, m.nomineeMobile, m.status, m.remarks
  ]);
  const wsMembers = XLSX.utils.aoa_to_sheet([membersHeaders, ...membersRows]);
  XLSX.utils.book_append_sheet(wb, wsMembers, "Members Database");

  // 3. Payments Sheet
  const paymentsHeaders = [
    "Receipt Number", "Member ID", "Member Name", "Month", "Year", 
    "Payment Type", "Amount", "Entry Date", "Remarks"
  ];
  const paymentsRows = payments.map(p => [
    p.receiptNo, p.memberId, p.memberName, p.month, p.year,
    p.paymentType, p.amount, p.entryDate, p.remarks
  ]);
  const wsPayments = XLSX.utils.aoa_to_sheet([paymentsHeaders, ...paymentsRows]);
  XLSX.utils.book_append_sheet(wb, wsPayments, "Payments");

  // 4. Bank Deposits Sheet
  const bankHeaders = [
    "Deposit Date", "Bank Name", "Branch Name", "Amount", "Slip Number", 
    "Reference", "Remarks"
  ];
  const bankRows = bankDeposits.map(b => [
    b.date, b.bankName, b.branch, b.amount, b.slipNumber,
    b.reference, b.remarks
  ]);
  const wsBank = XLSX.utils.aoa_to_sheet([bankHeaders, ...bankRows]);
  XLSX.utils.book_append_sheet(wb, wsBank, "Bank Deposits");

  // Write and Save
  XLSX.writeFile(wb, "Al-Baraka-Smart-Management-System.xlsx");
}

// Generate the Google Apps Script text for receipt PDFs and auto saving
export function generateGoogleAppsScript(settings: SystemSettings): string {
  return `/**
 * Google Apps Script for "Al-Baraka Smart Management System"
 * Created for: ${settings.orgName}
 * Founder: ${settings.founderName} (${settings.founderMobile})
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Al-Baraka Automation')
      .addItem('Generate Receipt PDF', 'createReceiptPDF')
      .addToUi();
}
`;
}

/**
 * Unified handlePrint utility function that targets the print element ID 
 * and ensures it becomes visible in the DOM during the print window lifecycle.
 */
export function handlePrint(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }

  // Preserve original display and visibility
  const originalDisplay = el.style.display;
  const originalVisibility = el.style.visibility;

  el.style.display = 'block';
  el.style.visibility = 'visible';

  // Create an offscreen iframe with standard non-zero dimensions (A4 printable width)
  // so the browser print engine computes layout, flex, grid, and table widths properly.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '1000px';
  iframe.style.height = '1400px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    iframe.remove();
    el.style.display = originalDisplay;
    el.style.visibility = originalVisibility;
    return;
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(s => s.outerHTML)
    .join('\n');

  doc.open();
  doc.write(
    '<!DOCTYPE html>' +
    '<html lang="bn">' +
    '<head>' +
    '<meta charset="utf-8" />' +
    '<title>প্রিন্ট ডকুমেন্ট</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">' +
    styles +
    '<style>' +
    '@page { size: A4 portrait; margin: 10mm; }' +
    '*, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
    'html, body { background: #ffffff !important; color: #0f172a !important; margin: 0 !important; padding: 0 !important; font-family: "Hind Siliguri", "Inter", system-ui, sans-serif !important; width: 100% !important; min-height: 100% !important; }' +
    'body { padding: 12px !important; }' +
    '.no-print, button, input, select, nav, header, footer { display: none !important; }' +
    '#' + elementId + ', .print-container { display: block !important; visibility: visible !important; width: 100% !important; margin: 0 !important; background: #ffffff !important; box-shadow: none !important; border: none !important; }' +
    'table { width: 100% !important; border-collapse: collapse !important; }' +
    'th, td { border: 1px solid #cbd5e1 !important; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div id="' + elementId + '" class="' + (el.className || '') + ' print-container">' +
    el.innerHTML +
    '</div>' +
    '</body>' +
    '</html>'
  );
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Iframe print error, invoking window.print():', err);
      window.print();
    } finally {
      setTimeout(() => {
        try {
          iframe.remove();
        } catch {}
        el.style.display = originalDisplay;
        el.style.visibility = originalVisibility;
      }, 1500);
    }
  }, 500);
}
