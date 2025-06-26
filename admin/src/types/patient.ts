import { Doctor } from "./doctor";

// Define DailyTreatment first to avoid circular references
export interface DailyTreatment {
  _id?: string;
  date: string;
  treatmentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  treatedByDoctor: string | null;
  procedure?: string;
  notes?: string;
  isCompleted?: boolean;
}

export type selectedToothSchema = {
  totalRemainingAmount: number;
  totalPaidAmount: number;
  dailyTreatments: DailyTreatment[];
  totalTreatmentAmount: number;
  number: string;
  details: string;
  position: string;
  procedure: string;
  side: string;
};

export type TreatmentPlanning = {
  _id: string;
  patientType : "Child" | "Adult";
  isCompleted: boolean;
  selectedTeethDetails: selectedToothSchema[];
  teethNumber: string;
  treatmentDate: string;
  treatmentDateNp: string;
  treatmentDetails: string;
  treatmentDocuments: {
    fileName: string;
    fileUrl: string;
    uploadDate: string;
    description: string;
    publicId: string;
  }[];
  treatmentFindings: string;
  clinicalFindings: string[];
  otherFindings: string;
  followUpDate?: string;
  followUpDateNp?: string;
  treatedByDoctor: Doctor;
  totalPlanAmount: string | number;
  totalPaidAmount: string | number;
  totalRemainingAmount: string | number;
  completionDate: string;
  completionDateNp: string;
};

export type MedicalDetails = {
  _id: string;
  checkUpDate: string;
  checkUpDateNp: string;
  followUpDate: string;
  followUpDateNp: string;
  diagnosis: string;
  chiefComplaint: string;
  investigation: {
    blood: string;
    bloodTestDate?: string;
    xray: string;
    xrayDate?: string;
    xrayImages?: Array<{
      url: string;
      publicId: string;
      uploadDate: string;
    }>;
    otherTests?: string;
    otherTestsDate?: string;
    [key: string]: any; // Allow additional properties
  };
  patientType: "Child" | "Adult";
  group?: "Ortho" | "Endo" | "Perio" | "Prostho" | "Surgery" | "General" | "Other";
  medicalHistory: {
    additionalNotes: any;
    bloodPressure: string;
    diabetes: boolean;
    thyroid: boolean;
    bleedingDisorder: boolean;
    pregnancy: boolean;
    asthma: boolean;
    allergies: string;
    otherConditions: string;
    noMedicalIssues: boolean;
  };
  treatmentPlanning: TreatmentPlanning[];
};

export type Patient = {
  doctorId: string;
  _id: string;
  personalDetails: {
    name: string;
    contactNumber: string;
    address: string;
    sn: string;
    dob: string;
    age: string;
    emailAddress: string;
    gender: string;
    referredBy: string;
    checkUpDate?: string;
    checkUpDateNp?: string;
    profilePhoto?: {
      url: string;
      publicId: string;
    };
  };
  medicalDetails: MedicalDetails[];
  createdAt: string;
  updatedAt: string;
  documents?: {
    fileName: string;
    fileUrl: string;
    uploadDate: string;
    description: string;
    publicId: string;
  }[];
};

export type FormData = {
  personalDetails: {
    name: string;
    contactNumber: string;
    emailAddress: string;
    address: string;
    sn: string;
    age: string;
    gender: "Male" | "Female" | "Other";
    createdAt: string;
    referredBy: string;
    checkUpDate: string;
    checkUpDateNp: string;
  };
  medicalDetails: {
    chiefComplaint: string;
    diagnosis: string;
    investigation: {
      blood: string;
      xray: string;
    };
    group: string;
    medicalHistory: {
      bloodPressure: string;
      diabetes: boolean;
      thyroid: boolean;
      bleedingDisorder: boolean;
      pregnancy: boolean;
      asthma: boolean;
      allergies: string;
      otherConditions: string;
      noMedicalIssues: boolean;
    };
    treatmentPlanning: TreatmentPlan[];
  };
  treatmentPlans: Array<{
    patientType: "Child" | "Adult";
    treatmentDate: string;
    treatmentDateNp: string;
    treatmentDetails: string;
    treatmentAmount: string;
    advancedAmount: string;
    treatedByDoctor: string;
    balanceAmount: string;
    teethNumber: string;
    treatmentFindings: string;
    clinicalFindings: ClinicalFinding[];
    otherFindings: string;
    followUpDate: string;
    followUpDateNp: string;
    completionDate: string;
    completionDateNp: string;
    isCompleted?: boolean;
    treatmentDocuments?: Array<{
      fileName: string;
      fileUrl: string;
      uploadDate: string;
    }>;
  }>;
};

// DailyTreatment interface moved to the top of the file

export interface ToothData {
  number: string;
  details: string;
  procedure: string;
  position?: string;
  side?: string;
  _id?: string; 
  treatmentId?: string;
  isCompleted?: boolean;
  dailyTreatments: DailyTreatment[];
  totalTreatmentAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  startDate?: string;
}

export type ToothProps = {
  number: string;
  position: "upper" | "lower";
  selected: boolean;
  onClick: (surface?: string) => void;
  procedure?: string;
};

export type ClinicalFinding =
  | "Caries"
  | "Decayed"
  | "Missing"
  | "Crowding"
  | "Swelling"
  | "Enlargement"
  | "Bleeding"
  | "Bad Breathing"
  | "Impaction"
  | "Pericoronitis"
  | "Food Lodgment"
  | "Attrition"
  | "Abrasion";

export interface TreatmentPlan {
  _id?: string;
  treatmentDate: string;
  treatmentDateNp: string;
  treatmentDetails: string;
  treatmentFindings: string;
  treatmentAmount: string;
  advancedAmount: string;
  balanceAmount: string;
  teethNumber: string;
  treatedByDoctor: string;
  isCompleted?: boolean;
  clinicalFindings: string[];
  otherFindings: string;
  followUpDate?: string;
  followUpDateNp?: string;
  completionDate?: string;
  completionDateNp?: string;
  treatmentDocuments?: Array<{
    fileName: string;
    fileUrl: string;
    uploadDate: string;
    publicId: string;
    description: string;
  }>;
  selectedTeethDetails?: ToothData[];
}

export type MedicalHistory = {
  bloodPressure: string;
  diabetes: boolean;
  thyroid: boolean;
  bleedingDisorder: boolean;
  pregnancy: boolean;
  asthma: boolean;
  allergies: string;
  otherConditions: string;
  noMedicalIssues: boolean; // New field
};

