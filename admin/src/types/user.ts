export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'superadmin';
  createdAt: string;
  updatedAt: string;
} 