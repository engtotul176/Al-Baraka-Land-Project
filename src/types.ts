/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Member {
  memberId: string;
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  whatsapp: string;
  nid: string;
  birthDate: string;
  address: string;
  profession: string;
  joiningDate: string;
  nominee: string;
  nomineeMobile: string;
  photo?: string; // base64
  status: 'Active' | 'Inactive';
  remarks: string;
}

export type PaymentType = 
  | 'Monthly Deposit' 
  | 'Registration Fee' 
  | 'Meeting Fee' 
  | 'Fine' 
  | 'Donation' 
  | 'Other';

export interface Payment {
  receiptNo: string;
  memberId: string;
  memberName: string;
  month: string;
  year: number;
  paymentType: PaymentType;
  amount: number;
  entryDate: string;
  remarks: string;
}

export interface BankDeposit {
  id: string;
  date: string;
  bankName: string;
  branch: string;
  amount: number;
  slipNumber: string;
  reference: string;
  remarks: string;
  slipPhoto?: string; // base64 representation of deposit slip
}

export interface SystemSettings {
  monthlyAmount: number;
  registrationFee: number;
  meetingFee: number;
  fine: number;
  orgName: string;
  orgSlogan: string;
  orgMobile: string;
  orgEmail: string;
  orgAddress: string;
  founderName: string;
  founderMobile: string;
  founderDesignation: string;
  logo: string; // base64 or SVG data URL
  founderPhoto: string; // base64 or SVG data URL
  signature: string; // base64 or SVG data URL
  collectorName?: string;
  collectorSignature?: string;
  treasurerName?: string;
  treasurerSignature?: string;
  presidentName?: string;
  presidentSignature?: string;
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  firebaseSyncEnabled?: boolean;
  adminPin?: string;
}
