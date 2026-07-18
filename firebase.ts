import { initializeApp, getApp, getApps, FirebaseApp, deleteApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc,
  doc, 
  writeBatch,
  Firestore 
} from 'firebase/firestore';
import { Member, Payment, BankDeposit, SystemSettings } from './types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function isFirebaseConfigured(settings: SystemSettings): boolean {
  const apiKey = settings.firebaseApiKey || ((import.meta as any).env?.VITE_FIREBASE_API_KEY as string) || "";
  const projectId = settings.firebaseProjectId || ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID as string) || "";
  const appId = settings.firebaseAppId || ((import.meta as any).env?.VITE_FIREBASE_APP_ID as string) || "";
  return !!(apiKey && projectId && appId);
}

export function initFirebase(settings: SystemSettings): { app: FirebaseApp; db: Firestore } | null {
  if (!isFirebaseConfigured(settings)) {
    return null;
  }

  const pId = settings.firebaseProjectId || ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID as string) || "";
  const firebaseConfig = {
    apiKey: settings.firebaseApiKey || ((import.meta as any).env?.VITE_FIREBASE_API_KEY as string) || "",
    authDomain: settings.firebaseAuthDomain || ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN as string) || (pId ? `${pId}.firebaseapp.com` : ""),
    projectId: pId,
    storageBucket: settings.firebaseStorageBucket || ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET as string) || (pId ? `${pId}.appspot.com` : ""),
    messagingSenderId: settings.firebaseMessagingSenderId || ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "",
    appId: settings.firebaseAppId || ((import.meta as any).env?.VITE_FIREBASE_APP_ID as string) || "",
  };

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      const currentApp = existingApps[0];
      const currentOptions = currentApp.options;
      const isDifferent = 
        currentOptions.apiKey !== firebaseConfig.apiKey ||
        currentOptions.projectId !== firebaseConfig.projectId ||
        currentOptions.appId !== firebaseConfig.appId;

      if (isDifferent) {
        // Delete the previous application from registry to allow new initialization immediately
        deleteApp(currentApp).catch(() => {});
        app = initializeApp(firebaseConfig);
      } else {
        app = currentApp;
      }
    } else {
      app = initializeApp(firebaseConfig);
    }
    db = getFirestore(app);
    return { app, db };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return null;
  }
}

// Helper to enforce timeout on Firestore promises to prevent infinite spinning in case of wrong credentials or poor network
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error("ফায়ারবেস ডাটাবেজ থেকে কোনো উত্তর পাওয়া যায়নি (১০ সেকেন্ড অতিবাহিত হয়েছে)। অনুগ্রহ করে আপনার ইন্টারনেট কানেকশন এবং সেটিংসের কীসমূহ পুনরায় যাচাই করুন।")), timeoutMs)
    )
  ]);
}

export async function uploadAllToFirebase(
  settings: SystemSettings,
  members: Member[],
  payments: Payment[],
  bankDeposits: BankDeposit[],
  onProgress?: (statusText: string) => void
): Promise<void> {
  const firebaseInstance = initFirebase(settings);
  if (!firebaseInstance) {
    throw new Error("Firebase configuration is missing or incomplete.");
  }

  const { db } = firebaseInstance;
  
  try {
    // 0. Quick pre-flight connection write check to fail fast in 5 seconds
    if (onProgress) onProgress("কানেকশন পরীক্ষা করা হচ্ছে...");
    try {
      const testDocRef = doc(db, 'settings', 'connection_test_upload');
      await withTimeout(setDoc(testDocRef, { testedAt: new Date().toISOString() }), 5000);
      await withTimeout(deleteDoc(testDocRef), 5000).catch(() => {});
    } catch (err: any) {
      console.error("Upload pre-flight check failed:", err);
      throw new Error("ফায়ারবেস ডাটাবেজের সাথে সংযোগ করা যায়নি। অনুগ্রহ করে নিশ্চিত করুন যে আপনি আপনার ফায়ারবেস কনসোলে 'Firestore Database' তৈরি করেছেন এবং রুলস (Rules) বা টেস্ট মোড (Test Mode) সচল রেখেছেন।");
    }

    // 1. Save Settings (save as a single document in 'settings' collection with ID 'system_config')
    if (onProgress) onProgress("ধাপ ১: সাধারণ সেটিংস ক্লাউডে সংরক্ষণ করা হচ্ছে...");
    const settingsDocRef = doc(db, 'settings', 'system_config');
    const { logo, founderPhoto, signature, ...otherSettings } = settings;
    
    // To prevent "Document parent/child size exceeds maximum (1MB)" in Firestore, we omit or truncate branding images if they are too large
    const safeLogo = (logo && logo.length > 300000) ? "" : logo;
    const safeFounderPhoto = (founderPhoto && founderPhoto.length > 300000) ? "" : founderPhoto;
    const safeSignature = (signature && signature.length > 300000) ? "" : signature;

    if ((logo && logo.length > 300000) || (founderPhoto && founderPhoto.length > 300000) || (signature && signature.length > 300000)) {
      console.warn("Some branding images are too large (>300KB) and were skipped in cloud backup to prevent Firestore 1MB document limit crash.");
    }
    
    await withTimeout(setDoc(settingsDocRef, {
      ...otherSettings,
      logo: safeLogo,
      founderPhoto: safeFounderPhoto,
      signature: safeSignature,
      updatedAt: new Date().toISOString()
    }), 10000);

    // 2. Clear old Members in Firestore that are not in local members
    if (onProgress) onProgress("ধাপ ২: ক্লাউডে থাকা পূর্বের সদস্য তালিকা যাচাই ও অতিরিক্ত সদস্য অপসারণ করা হচ্ছে...");
    const membersCollection = collection(db, 'members');
    const existingMembersSnap = await withTimeout(getDocs(membersCollection), 10000);
    const localMemberIds = new Set(members.map(m => m.memberId));
    let batch = writeBatch(db);
    let count = 0;

    for (const docSnap of existingMembersSnap.docs) {
      if (!localMemberIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        count++;
        if (count === 500) {
          await withTimeout(batch.commit(), 10000);
          batch = writeBatch(db);
          count = 0;
        }
      }
    }
    if (count > 0) {
      await withTimeout(batch.commit(), 10000);
    }

    // Save current Members in batches of 500
    if (onProgress) onProgress(`ধাপ ৩: সর্বমোট ${members.length} জন সদস্যের তথ্য ক্লাউড ফায়ারস্টোরে আপলোড করা হচ্ছে...`);
    batch = writeBatch(db);
    count = 0;
    for (const m of members) {
      const memberDocRef = doc(membersCollection, m.memberId);
      batch.set(memberDocRef, m);
      count++;
      if (count === 500) {
        await withTimeout(batch.commit(), 10000);
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      await withTimeout(batch.commit(), 10000);
    }

    // 3. Clear old Payments in Firestore that are not in local payments
    if (onProgress) onProgress("ধাপ ৪: ক্লাউডে থাকা পূর্বের পেমেন্ট তথ্য যাচাই ও অতিরিক্ত পেমেন্ট অপসারণ করা হচ্ছে...");
    const paymentsCollection = collection(db, 'payments');
    const existingPaymentsSnap = await withTimeout(getDocs(paymentsCollection), 10000);
    const localPaymentReceipts = new Set(payments.map(p => p.receiptNo));
    batch = writeBatch(db);
    count = 0;

    for (const docSnap of existingPaymentsSnap.docs) {
      if (!localPaymentReceipts.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        count++;
        if (count === 500) {
          await withTimeout(batch.commit(), 10000);
          batch = writeBatch(db);
          count = 0;
        }
      }
    }
    if (count > 0) {
      await withTimeout(batch.commit(), 10000);
    }

    // Save current Payments in batches
    if (onProgress) onProgress(`ধাপ ৫: সর্বমোট ${payments.length} টি পেমেন্ট রশিদ ক্লাউড ফায়ারস্টোরে আপলোড করা হচ্ছে...`);
    batch = writeBatch(db);
    count = 0;
    for (const p of payments) {
      const paymentDocRef = doc(paymentsCollection, p.receiptNo);
      batch.set(paymentDocRef, p);
      count++;
      if (count === 500) {
        await withTimeout(batch.commit(), 10000);
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      await withTimeout(batch.commit(), 10000);
    }

    // 4. Clear old Bank Deposits in Firestore that are not in local bankDeposits
    if (onProgress) onProgress("ধাপ ৬: ক্লাউডে থাকা পূর্বের ব্যাংক জমার তথ্য যাচাই ও অতিরিক্ত ব্যাংক জমা অপসারণ করা হচ্ছে...");
    const depositsCollection = collection(db, 'bankDeposits');
    const existingDepositsSnap = await withTimeout(getDocs(depositsCollection), 10000);
    const localDepositIds = new Set(bankDeposits.map(d => d.id));
    batch = writeBatch(db);
    count = 0;

    for (const docSnap of existingDepositsSnap.docs) {
      if (!localDepositIds.has(docSnap.id)) {
        batch.delete(docSnap.ref);
        count++;
        if (count === 500) {
          await withTimeout(batch.commit(), 10000);
          batch = writeBatch(db);
          count = 0;
        }
      }
    }
    if (count > 0) {
      await withTimeout(batch.commit(), 10000);
    }

    // Save current Bank Deposits in batches
    if (onProgress) onProgress(`ধাপ ৭: সর্বমোট ${bankDeposits.length} টি ব্যাংক জমার তথ্য ক্লাউড ফায়ারস্টোরে আপলোড করা হচ্ছে...`);
    batch = writeBatch(db);
    count = 0;
    for (const d of bankDeposits) {
      const depositDocRef = doc(depositsCollection, d.id);
      batch.set(depositDocRef, d);
      count++;
      if (count === 500) {
        await withTimeout(batch.commit(), 10000);
        batch = writeBatch(db);
        count = 0;
      }
    }
    if (count > 0) {
      await withTimeout(batch.commit(), 10000);
    }

    if (onProgress) onProgress("ধাপ ৮: সকল তথ্য সফলভাবে সিঙ্ক সম্পন্ন হয়েছে!");
    console.log("Uploaded all data successfully to Firestore!");
  } catch (err) {
    console.error("Error uploading to Firestore:", err);
    throw err;
  }
}

export async function downloadAllFromFirebase(
  settings: SystemSettings
): Promise<{
  members: Member[];
  payments: Payment[];
  bankDeposits: BankDeposit[];
  settings?: SystemSettings;
} | null> {
  const firebaseInstance = initFirebase(settings);
  if (!firebaseInstance) {
    return null;
  }

  const { db } = firebaseInstance;

  try {
    // Fetch all collections in parallel to speed up and fail fast within 10 seconds
    const [settingsSnap, membersSnap, paymentsSnap, depositsSnap] = await withTimeout(
      Promise.all([
        getDocs(collection(db, 'settings')),
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'payments')),
        getDocs(collection(db, 'bankDeposits'))
      ]),
      10000
    );

    // 1. Process Settings
    let cloudSettings: SystemSettings | undefined;
    settingsSnap.forEach((docSnap) => {
      if (docSnap.id === 'system_config') {
        cloudSettings = docSnap.data() as SystemSettings;
      }
    });

    // 2. Process Members
    const members: Member[] = [];
    membersSnap.forEach((docSnap) => {
      members.push(docSnap.data() as Member);
    });

    // 3. Process Payments
    const payments: Payment[] = [];
    paymentsSnap.forEach((docSnap) => {
      payments.push(docSnap.data() as Payment);
    });

    // 4. Process Bank Deposits
    const bankDeposits: BankDeposit[] = [];
    depositsSnap.forEach((docSnap) => {
      bankDeposits.push(docSnap.data() as BankDeposit);
    });

    // Sort to maintain original view sorting
    members.sort((a, b) => b.memberId.localeCompare(a.memberId));
    payments.sort((a, b) => b.receiptNo.localeCompare(a.receiptNo));
    bankDeposits.sort((a, b) => b.date.localeCompare(a.date));

    return {
      members,
      payments,
      bankDeposits,
      settings: cloudSettings
    };
  } catch (err: any) {
    console.error("Error downloading from Firestore:", err);
    throw new Error(err.message || "ফায়ারবেস ক্লাউড থেকে ডাটা ডাউনলোড করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আপনার ইন্টারনেট কানেকশন এবং কনফিগারেশন পুনরায় যাচাই করুন।");
  }
}

export async function syncSingleItem(
  settings: SystemSettings,
  collectionName: 'members' | 'payments' | 'bankDeposits' | 'settings',
  docId: string,
  data: any
): Promise<void> {
  if (!settings.firebaseSyncEnabled) return;
  
  const firebaseInstance = initFirebase(settings);
  if (!firebaseInstance) return;

  const { db } = firebaseInstance;
  try {
    const docRef = doc(db, collectionName, docId);
    // Enforce a quick timeout of 6 seconds so background sync doesn't lock up or retard UI if network is bad
    await withTimeout(setDoc(docRef, data), 6000);
    console.log(`Successfully synced single item to Firestore: ${collectionName}/${docId}`);
  } catch (err) {
    console.error(`Failed to sync single item ${collectionName}/${docId} to Firestore:`, err);
  }
}

export async function testFirebaseConnection(settings: SystemSettings): Promise<{ success: boolean; message: string }> {
  const firebaseInstance = initFirebase(settings);
  if (!firebaseInstance) {
    return { success: false, message: "ফায়ারবেস ঠিকমত কনফিগার করা হয়নি বা অপূর্ণ তথ্য রয়েছে।" };
  }

  const { db } = firebaseInstance;
  try {
    const testDocRef = doc(db, 'settings', 'connection_test');
    await withTimeout(setDoc(testDocRef, { 
      status: "connected", 
      testedAt: new Date().toISOString() 
    }), 5000);
    await withTimeout(deleteDoc(testDocRef), 5000);
    return { 
      success: true, 
      message: "কানেকশন সম্পূর্ণ সফল হয়েছে! ডাটাবেজ সচল রয়েছে এবং সিঙ্ক করার জন্য প্রস্তুত।" 
    };
  } catch (err: any) {
    console.error("Firebase connection test failed:", err);
    return { 
      success: false, 
      message: `কানেকশন ব্যর্থ হয়েছে: ${err.message || err}` 
    };
  }
}
