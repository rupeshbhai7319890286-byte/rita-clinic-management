import { PatientRecord, PatientUser, RequestItem, SaleBill, UdhaariRecord } from '../types';

export const CLINIC_CONFIG = {
  name: 'रीता क्लिनिक (Rita Clinic)',
  englishName: 'Rita Clinic',
  doctorName: 'डॉ. रूपेश कुमार पोद्दार',
  degrees: 'CMS & ED, EMT (Emergency Medical Technician)',
  address: 'साइकिल चौक, मोहनपुर, मुजफ्फरपुर, बिहार – 843121',
  phone: '7319890286',
  upiId: '7319890286@upi',
  emergencyPhone: '112',
  openingHours: 'सुबह 08:00 से रात्रि 09:00 बजे तक (प्रतिदिन)',
  adminId: '7319890286',
  adminPassword: 'Rupmala@2005',
};

export const DEFAULT_PATIENT_USERS: PatientUser[] = [
  {
    id: 'user_1',
    name: 'राम प्रवेश सिंह',
    phone: '9876543210',
    password: '123',
    age: '48 वर्ष',
    gender: 'पुरुष',
    address: 'साइकिल चौक, मोहनपुर',
    createdAt: '2026-10-01',
  },
  {
    id: 'user_2',
    name: 'कांति देवी',
    phone: '9123456780',
    password: '123',
    age: '72 वर्ष',
    gender: 'महिला',
    address: 'साइकिल चौक, गली नं 2, मोहनपुर (मकान संख्या 44)',
    createdAt: '2026-10-05',
  },
];

const DEFAULT_REQUESTS: RequestItem[] = [
  {
    id: 'req_1',
    tokenNo: 101,
    type: 'अपॉइंटमेंट',
    name: 'सुरेश पंडित',
    phone: '9876543210',
    age: '42 वर्ष',
    gender: 'पुरुष',
    date: 'आज',
    timeSlot: 'सुबह 10:30',
    info: '2 दिन से तेज बुखार, बदन दर्द और कमजोरी',
    isEmergency: false,
    status: 'लंबित',
    createdAt: new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'req_2',
    tokenNo: 102,
    type: 'होम विजिट',
    name: 'कांति देवी',
    phone: '9123456780',
    age: '72 वर्ष',
    gender: 'महिला',
    date: 'आज',
    timeSlot: 'दोपहर 01:00',
    info: 'बुजुर्ग मरीज, चलने में असमर्थ, पीठ में तेज दर्द और घबराहट',
    address: 'साइकिल चौक, गली नं 2, मोहनपुर (मकान संख्या 44)',
    isEmergency: true,
    status: 'स्वीकृत',
    createdAt: '1 घंटे पहले',
  },
  {
    id: 'req_3',
    tokenNo: 103,
    type: 'कॉल बैक',
    name: 'मनोज झा',
    phone: '9431409988',
    date: 'आज',
    info: 'खून जांच रिपोर्ट और नई दवाइयों के बारे में डॉक्टर साहब से सलाह',
    status: 'लंबित',
    createdAt: '35 मिनट पहले',
  },
];

const DEFAULT_PATIENTS: PatientRecord[] = [
  {
    id: 'p_1',
    opdNo: 'RC-2026-001',
    name: 'राम प्रवेश सिंह',
    age: '48 वर्ष',
    gender: 'पुरुष',
    phone: '9876543210',
    bp: '130/85 mmHg',
    pulse: '76 bpm',
    weight: '68 kg',
    temp: '98.6 °F',
    symptoms: 'वायरल बुखार, सूखी खांसी, बदन दर्द',
    diagnosis: 'Acute Viral Pharyngitis with Pyrexia',
    medicines: [
      { id: 'm1', name: 'Tab. Paracetamol 650mg', dosage: '1 गोली', timing: 'सुबह-शाम (खाने के बाद)', duration: '4 दिन' },
      { id: 'm2', name: 'Tab. Cetirizine 10mg', dosage: '1 गोली', timing: 'रात को सोते समय', duration: '5 दिन' },
      { id: 'm3', name: 'Cap. Pantoprazole 40mg', dosage: '1 कैप्सूल', timing: 'सुबह खाली पेट', duration: '5 दिन' },
      { id: 'm4', name: 'Multivitamin with Zinc', dosage: '1 गोली', timing: 'दोपहर खाने के बाद', duration: '10 दिन' },
    ],
    instructions: 'पर्याप्त गुनगुना पानी पिएं, तला-भुना न खाएं। 4 दिन बाद पुनः दिखाएं।',
    nextVisit: '4 दिन बाद',
    createdAt: new Date().toLocaleDateString('hi-IN'),
  },
];

const DEFAULT_BILLS: SaleBill[] = [
  {
    id: 'b_1',
    billNo: 'BILL-412',
    name: 'राम प्रवेश सिंह',
    phone: '9876543210',
    date: new Date().toLocaleDateString('hi-IN'),
    items: [
      { id: 'bi_1', name: 'Paracetamol 650mg (10 Tab)', qty: 1, price: 35 },
      { id: 'bi_2', name: 'Pantoprazole 40mg (10 Cap)', qty: 1, price: 85 },
      { id: 'bi_3', name: 'Multivitamin Syrups (200ml)', qty: 1, price: 140 },
    ],
    subTotal: 260,
    discount: 10,
    total: 250,
    paid: 250,
    balance: 0,
    paymentMode: 'UPI',
  },
];

const DEFAULT_UDHAARI: UdhaariRecord[] = [
  {
    id: 'u_1',
    name: 'विनोद साह',
    phone: '9835012345',
    balance: 750,
    totalGiven: 1250,
    totalReceived: 500,
    lastUpdated: new Date().toLocaleDateString('hi-IN'),
    notes: 'साइकिल चौक किराना दुकान वाले',
    history: [
      { date: '15/10/2026', amount: 500, mode: 'नकद जमा', note: 'आधा भुगतान दिया' },
    ],
  },
  {
    id: 'u_2',
    name: 'संजय राय',
    phone: '9122334455',
    balance: 420,
    totalGiven: 420,
    totalReceived: 0,
    lastUpdated: '22/10/2026',
    notes: 'दवा व ड्रिप इंजेक्शन का बकाया',
    history: [],
  },
];

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage error: ', err);
  }
}

export function initializeClinicData() {
  const reqs = getStoredData<RequestItem[]>('rc_requests', []);
  if (reqs.length === 0) setStoredData('rc_requests', DEFAULT_REQUESTS);

  const patients = getStoredData<PatientRecord[]>('rc_doc_patients', []);
  if (patients.length === 0) setStoredData('rc_doc_patients', DEFAULT_PATIENTS);

  const bills = getStoredData<SaleBill[]>('rc_doc_sales', []);
  if (bills.length === 0) setStoredData('rc_doc_sales', DEFAULT_BILLS);

  const udhaari = getStoredData<UdhaariRecord[]>('rc_doc_udhaari', []);
  if (udhaari.length === 0) setStoredData('rc_doc_udhaari', DEFAULT_UDHAARI);

  const patientUsers = getStoredData<PatientUser[]>('rc_patient_users', []);
  if (patientUsers.length === 0) setStoredData('rc_patient_users', DEFAULT_PATIENT_USERS);
}

export function getPatientUsers(): PatientUser[] {
  return getStoredData<PatientUser[]>('rc_patient_users', DEFAULT_PATIENT_USERS);
}

export function savePatientUsers(users: PatientUser[]): void {
  setStoredData('rc_patient_users', users);
}

export function getLoggedInPatient(): PatientUser | null {
  return getStoredData<PatientUser | null>('rc_logged_in_patient', null);
}

export function setLoggedInPatient(user: PatientUser | null): void {
  setStoredData('rc_logged_in_patient', user);
}

export function openWhatsAppChat(phone: string, text: string) {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function generateUpiQrUrl(amount: number, note = 'Rita Clinic Payment'): string {
  const upiLink = `upi://pay?pa=${CLINIC_CONFIG.upiId}&pn=${encodeURIComponent('Rita Clinic')}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(upiLink)}`;
}

export function exportBackupJson() {
  const data = {
    exportDate: new Date().toISOString(),
    clinic: CLINIC_CONFIG,
    requests: getStoredData('rc_requests', []),
    patients: getStoredData('rc_doc_patients', []),
    sales: getStoredData('rc_doc_sales', []),
    udhaari: getStoredData('rc_doc_udhaari', []),
    patientUsers: getStoredData('rc_patient_users', []),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rita_Clinic_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getCustomPublicUrl(): string {
  try {
    return localStorage.getItem('rita_custom_public_url') || '';
  } catch {
    return '';
  }
}

export function setCustomPublicUrl(url: string): void {
  try {
    localStorage.setItem('rita_custom_public_url', url.trim());
  } catch (err) {
    console.error('Error saving custom URL:', err);
  }
}

/**
 * Returns the public app link that patients can open.
 * If the doctor has set a custom live/published URL, returns that.
 * Otherwise returns the current active origin (window.location.origin).
 */
export function getPublicShareUrl(): string {
  const custom = getCustomPublicUrl();
  if (custom) return custom;

  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  // Use the active origin directly so that no 404 "Page Not Found" is triggered
  return window.location.origin;
}

export function getDoctorPhoto(): string {
  try {
    const custom = localStorage.getItem('rita_doctor_custom_photo');
    if (custom) return custom;
  } catch {}
  return '/doctor-photo.png';
}

export function setDoctorPhoto(dataUrl: string): void {
  try {
    localStorage.setItem('rita_doctor_custom_photo', dataUrl);
  } catch (err) {
    console.error('Error saving custom doctor photo:', err);
  }
}

export function resetDoctorPhoto(): void {
  try {
    localStorage.removeItem('rita_doctor_custom_photo');
  } catch {}
}

