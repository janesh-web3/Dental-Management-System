import { Icons } from "@/components/ui/icons";

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export interface Courses {
  name: string;
  _id: string;
  subjects: [
    {
      monthlyFee: string;
      regularFee: string;
      subjectName: string;
      subjectTeacher: string;
      _id: string;
    },
  ];
}
[];

export interface StudentCourse {
  courseEnroll: {
    name: string;
  };
  subjectsEnroll: {
    subjectName: {
      subjectName: string;
    };
    feeType: string;
    discount: string;
    _id: string;
  }[];
}

export interface StudentDetails {
  personalInfo: {
    studentName: string;
    schoolName: string;
    address: string;
    dateOfBirth: null;
    gender: string;
    contactNo: string;
    billNo: [
      {
        billNo: string;
        dateSubmitted: string;
        paid: string;
        method: string;
      },
    ];
    admissionNumber: string;
    paymentDeadline: string;
    guardianName: string;
    guardianContact: string;
    localGuardianName: string;
    localGuardianContact: string;
    paymentMethod: string;
    referredBy: string;
  };
  courses: [
    {
      courseEnroll: string;
      subjectsEnroll: [
        {
          subjectName: string;
          feeType: string;
          discount: number;
        },
      ];
    },
  ];
  photo: string;
  admissionFee: number;
  selectedBook: object;
  tshirtFee: number;
  examFee: number;
  document: boolean;
  totalDiscount: number;
  paymentDeadline: null;
  paid: number;
  remaining: number;
  totalAmount: number;
  totalAfterDiscount: number;
  quizzes: string;
  dateOfAdmission: string;
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;
