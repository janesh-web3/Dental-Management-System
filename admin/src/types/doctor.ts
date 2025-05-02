export type Doctor = {
    _id: string;
    name: string;
    age: string;
    nmcNumber: string;
    email: string;
    contactNumber: string;
    address: string;
    qualifications: string[];
    specialization: string;
    experienceYears: string;
    availability: { day: string; startTime: string; endTime: string }[];
    image: { url: string };
    isActive: boolean;
    appointments: string[];
  };
  