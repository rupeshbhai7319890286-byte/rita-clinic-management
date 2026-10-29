export interface RequestItem {
  id: string;
  tokenNo: number;
  type: 'अपॉइंटमेंट' | 'होम विजिट' | 'कॉल बैक';
  name: string;
  phone: string;
  age?: string;
  gender?: string;
  date: string;
  timeSlot?: string;
  info: string;
  address?: string;
  isEmergency?: boolean;
  status: 'लंबित' | 'स्वीकृत' | 'पूर्ण' | 'रद्द';
  createdAt: string;
  doctorNotes?: string;
}

export interface RxMedicine {
  id: string;
  name: string;
  dosage: string; // e.g. "1 गोली सुबह-शाम" or "1 Tab BD"
  duration: string; // e.g. "5 दिन"
  timing: string; // "खाने के बाद" (After food) / "भूखे पेट" (Before food)
}

export interface PatientRecord {
  id: string;
  opdNo: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  bp?: string;
  pulse?: string;
  weight?: string;
  temp?: string;
  symptoms: string;
  diagnosis: string;
  medicines: RxMedicine[];
  instructions: string;
  nextVisit?: string;
  createdAt: string;
}

export interface BillItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface SaleBill {
  id: string;
  billNo: string;
  name: string;
  phone: string;
  date: string;
  items: BillItem[];
  subTotal: number;
  discount: number;
  total: number;
  paid: number;
  balance: number;
  paymentMode: 'UPI' | 'CASH' | 'उधारी' | 'अन्य';
}

export interface UdhaariPayment {
  date: string;
  amount: number;
  mode: string;
  note?: string;
}

export interface UdhaariRecord {
  id: string;
  name: string;
  phone: string;
  balance: number;
  totalGiven: number;
  totalReceived: number;
  lastUpdated: string;
  history: UdhaariPayment[];
  notes?: string;
}

export interface PatientUser {
  id: string;
  name: string;
  phone: string;
  password: string;
  age?: string;
  gender?: string;
  address?: string;
  createdAt: string;
}
