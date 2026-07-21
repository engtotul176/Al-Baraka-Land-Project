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

// Convert English numbers into English digits or formatted currency (Bangla-themed)
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

  // Core divisions in Bengali currency system
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
 * This script runs inside Google Sheets and automates:
 * 1. Generating professional PDF Receipts
 * 2. Saving them in a specific Google Drive folder
 * 3. Preparing direct sharing links (e.g., for Whatsapp/Email)
 * 
 * Created for: ${settings.orgName}
 * Founder: ${settings.founderName} (${settings.founderMobile})
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Al-Baraka Automation')
      .addItem('Generate Receipt PDF', 'createReceiptPDF')
      .addItem('Send WhatsApp Reminder', 'sendWhatsAppReminder')
      .addToUi();
}

/**
 * Creates a beautiful PDF Receipt from the active Row on "Payments" sheet
 */
function createReceiptPDF() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Payments");
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Error: 'Payments' sheet not found!");
    return;
  }
  
  var activeCell = sheet.getActiveCell();
  var row = activeCell.getRow();
  
  if (row < 2) {
    SpreadsheetApp.getUi().alert("Please select a valid payment row (Row 2 or below) to generate a receipt.");
    return;
  }
  
  // Read row values
  var data = sheet.getRange(row, 1, 1, 9).getValues()[0];
  var receiptNo = data[0];
  var memberId = data[1];
  var name = data[2];
  var month = data[3];
  var year = data[4];
  var type = data[5];
  var amount = data[6];
  var date = Utilities.formatDate(new Date(data[7]), Session.getScriptTimeZone(), "yyyy-MM-dd");
  var remarks = data[8];
  
  if (!receiptNo) {
    SpreadsheetApp.getUi().alert("Error: Receipt Number is blank in the selected row!");
    return;
  }
  
  // Try to find or create "Al-Baraka Receipts" folder in Google Drive
  var folders = DriveApp.getFoldersByName("Al-Baraka Receipts");
  var folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder("Al-Baraka Receipts");
  }
  
  // Create a template document or construct HTML content
  var htmlContent = \`
    <html>
      <body style="font-family: 'Arial', sans-serif; padding: 20px; color: #111;">
        <div style="border: 4px double #013220; padding: 20px; max-width: 600px; margin: auto; position: relative;">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 15px;">
            <h2 style="color: #013220; margin: 0; font-size: 24px;">${settings.orgName}</h2>
            <p style="color: #d4af37; font-style: italic; margin: 5px 0 0 0; font-size: 14px;">${settings.orgSlogan}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #555;">ঠিকানা: ${settings.orgAddress} | মোবাইল: ${settings.orgMobile}</p>
          </div>
          
          <div style="text-align: center; margin: 15px 0;">
            <span style="background-color: #013220; color: white; padding: 5px 15px; font-weight: bold; font-size: 14px; border-radius: 3px;">টাকা প্রাপ্তির রশিদ</span>
          </div>
          
          <!-- Metadata Table -->
          <table style="width: 100%; font-size: 13px; margin-bottom: 15px; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding: 4px 0;"><strong>রশিদ নম্বর:</strong> \` + receiptNo + \`</td>
              <td style="width: 50%; padding: 4px 0; text-align: right;"><strong>তারিখ:</strong> \` + date + \`</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;"><strong>সদস্য আইডি:</strong> \` + memberId + \`</td>
              <td style="padding: 4px 0; text-align: right;"><strong>পরিশোধের মাস:</strong> \` + month + \` - \` + year + \`</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 4px 0; border-top: 1px dashed #ddd; padding-top: 8px;"><strong>সদস্যের নাম:</strong> \` + name + \`</td>
            </tr>
          </table>
          
          <!-- Payment Details -->
          <table style="width: 100%; border: 1px solid #ddd; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">
            <thead>
              <tr style="background-color: #f5f5f5; border-bottom: 1px solid #ddd;">
                <th style="padding: 8px; text-align: left;">বিবরণ</th>
                <th style="padding: 8px; text-align: right;">পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">\` + type + \` (\` + remarks + \`)</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">\` + amount + \` ৳</td>
              </tr>
              <tr style="font-weight: bold; border-top: 1px solid #ddd;">
                <td style="padding: 8px; text-align: right;">সর্বমোট:</td>
                <td style="padding: 8px; text-align: right; color: #013220;">\` + amount + \` ৳</td>
              </tr>
            </tbody>
          </table>
          
          <!-- Bottom Signatures -->
          <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px;">
            <div>
              <div style="height: 40px;"></div>
              <p style="border-top: 1px solid #aaa; width: 120px; text-align: center; margin: 0;">গ্রাহকের স্বাক্ষর</p>
            </div>
            <div style="text-align: right;">
              <div style="height: 40px; text-align: right;">
                <p style="font-family: 'Brush Script MT', cursive; font-size: 18px; color: #333; margin:0; padding-right:15px;">${settings.founderName.split(' ').slice(-2).join(' ')}</p>
              </div>
              <p style="border-top: 1px solid #aaa; width: 150px; text-align: center; margin: 0; display: inline-block;">আদায়কারীর স্বাক্ষর (${settings.founderName})</p>
            </div>
          </div>
          
          <div style="text-align: center; font-size: 9px; color: #777; margin-top: 25px; border-top: 1px solid #f0f0f0; padding-top: 5px;">
            এটি একটি স্বয়ংক্রিয় ডিজিটাল রশিদ। জেনারেট করেছেন: ${settings.founderName}
          </div>
        </div>
      </body>
    </html>
  \`;
  
  // Create temporary HTML file and convert to PDF
  var tempFile = DriveApp.createFile("temp_" + receiptNo + ".html", htmlContent, MimeType.HTML);
  var pdfBlob = tempFile.getAs(MimeType.PDF).setName(receiptNo + "_Receipt.pdf");
  var pdfFile = folder.createFile(pdfBlob);
  
  // Clean up temp file
  tempFile.setTrashed(true);
  
  // Set sharing to anyone with link can view
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var link = pdfFile.getDownloadUrl();
  
  // Record PDF URL back to the Payments Sheet! (e.g. into column 10)
  sheet.getRange(row, 10).setValue(pdfFile.getUrl());
  
  var ui = SpreadsheetApp.getUi();
  ui.alert("Receipt Generated successfully!\\n\\nReceipt PDF Saved to Drive folder: 'Al-Baraka Receipts'\\nFile Name: " + receiptNo + "_Receipt.pdf\\n\\nShareable Link has been written back to Column J of this row.");
}

/**
 * Automates creating a WhatsApp direct messaging link for payment alerts
 */
function sendWhatsAppReminder() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Payments");
  if (!sheet) return;
  
  var activeCell = sheet.getActiveCell();
  var row = activeCell.getRow();
  
  if (row < 2) return;
  
  var data = sheet.getRange(row, 1, 1, 10).getValues()[0];
  var receiptNo = data[0];
  var name = data[2];
  var month = data[3];
  var amount = data[6];
  var phone = sheet.getRange(row, 5).getValue(); // Assuming phone is stored on Sheet or custom mapped
  var pdfUrl = data[9] || "No PDF link generated yet";
  
  if (!phone) {
    phone = "01672965561"; // Fallback to founder for testing
  }
  
  // Format phone (remove leading zero, prefix country code)
  var cleanPhone = phone.toString().replace(/[^0-9+]/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "88" + cleanPhone;
  }
  
  var msg = "আসসালামু আলাইকুম, শ্রদ্ধেয় " + name + "।\\n" +
            "আপনার আল-বারাকা ভূমি প্রকল্প এর " + month + " মাসের সঞ্চয় বাবদ " + amount + " ৳ জমা সফল হয়েছে।\\n" +
            "রশিদ নং: " + receiptNo + "\\n" +
            "ডিজিটাল রশিদের লিংক: " + pdfUrl + "\\n\\n" +
            "ধন্যবাদান্তে,\\n${settings.founderName}\\n${settings.orgName}";
            
  var encodedMsg = encodeURIComponent(msg);
  var whatsAppLink = "https://api.whatsapp.com/send?phone=" + cleanPhone + "&text=" + encodedMsg;
  
  // Open the Link using Google Apps Script UI or log it
  var htmlOutput = HtmlService.createHtmlOutput('<script>window.open("' + whatsAppLink + '", "_blank");google.script.host.close();</script>')
      .setWidth(10)
      .setHeight(10);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, "Launching WhatsApp...");
}
`;
}
