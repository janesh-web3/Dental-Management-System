import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileText,
  CreditCard,
  // Banknote,
  PiggyBank,
  // Receipt,
  Calculator
} from 'lucide-react';
import DelightfulForm from '@/components/ui/DelightfulForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { crudRequest } from '@/lib/api';

interface DelightfulFinanceFormProps {
  formType: 'income' | 'expense' | 'payment';
  onSuccess?: (data: any) => void;
  editingRecord?: any;
  modalClose?: () => void;
  patients?: any[];
  services?: any[];
}

const incomeCategories = [
  { value: 'consultation', label: 'Consultation Fees', emoji: '💬', color: 'bg-blue-100 text-blue-800' },
  { value: 'treatment', label: 'Treatment Fees', emoji: '🦷', color: 'bg-green-100 text-green-800' },
  { value: 'cleaning', label: 'Cleaning Services', emoji: '🧼', color: 'bg-teal-100 text-teal-800' },
  { value: 'orthodontics', label: 'Orthodontic Treatment', emoji: '😬', color: 'bg-purple-100 text-purple-800' },
  { value: 'surgery', label: 'Surgical Procedures', emoji: '🔪', color: 'bg-red-100 text-red-800' },
  { value: 'emergency', label: 'Emergency Services', emoji: '🚨', color: 'bg-orange-100 text-orange-800' },
  { value: 'insurance', label: 'Insurance Payments', emoji: '🛡️', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'other', label: 'Other Income', emoji: '💰', color: 'bg-yellow-100 text-yellow-800' }
];

const expenseCategories = [
  { value: 'supplies', label: 'Medical Supplies', emoji: '🏥', color: 'bg-red-100 text-red-800' },
  { value: 'equipment', label: 'Equipment Purchase', emoji: '🔧', color: 'bg-blue-100 text-blue-800' },
  { value: 'rent', label: 'Office Rent', emoji: '🏢', color: 'bg-gray-100 text-gray-800' },
  { value: 'utilities', label: 'Utilities', emoji: '💡', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'staff', label: 'Staff Salaries', emoji: '👥', color: 'bg-green-100 text-green-800' },
  { value: 'marketing', label: 'Marketing', emoji: '📢', color: 'bg-purple-100 text-purple-800' },
  { value: 'maintenance', label: 'Maintenance', emoji: '🔨', color: 'bg-orange-100 text-orange-800' },
  { value: 'insurance', label: 'Insurance', emoji: '🛡️', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'training', label: 'Training & Education', emoji: '📚', color: 'bg-pink-100 text-pink-800' },
  { value: 'other', label: 'Other Expenses', emoji: '📋', color: 'bg-gray-100 text-gray-800' }
];

const paymentMethods = [
  { value: 'cash', label: 'Cash', emoji: '💵', color: 'bg-green-100 text-green-800' },
  { value: 'credit-card', label: 'Credit Card', emoji: '💳', color: 'bg-blue-100 text-blue-800' },
  { value: 'debit-card', label: 'Debit Card', emoji: '💳', color: 'bg-purple-100 text-purple-800' },
  { value: 'bank-transfer', label: 'Bank Transfer', emoji: '🏦', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'check', label: 'Check', emoji: '📝', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'digital-wallet', label: 'Digital Wallet', emoji: '📱', color: 'bg-pink-100 text-pink-800' },
  { value: 'insurance', label: 'Insurance', emoji: '🛡️', color: 'bg-gray-100 text-gray-800' }
];

const DelightfulFinanceForm: React.FC<DelightfulFinanceFormProps> = ({
  formType,
  onSuccess,
  editingRecord,
  modalClose,
  patients = [],
  // services = []
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  const handleSubmit = async (formData: any) => {
    try {
      let endpoint = '';
      let recordData: any = {};

      switch (formType) {
        case 'income':
          endpoint = editingRecord ? `/finance/income/${editingRecord._id}` : '/finance/income';
          recordData = {
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: formData.category,
            date: formData.date,
            paymentMethod: formData.paymentMethod,
            patientId: formData.patientId,
            notes: formData.notes,
            isRecurring: formData.isRecurring === 'true'
          };
          break;
        case 'expense':
          endpoint = editingRecord ? `/finance/expense/${editingRecord._id}` : '/finance/expense';
          recordData = {
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: formData.category,
            date: formData.date,
            paymentMethod: formData.paymentMethod,
            vendor: formData.vendor,
            notes: formData.notes,
            isRecurring: formData.isRecurring === 'true'
          };
          break;
        case 'payment':
          endpoint = editingRecord ? `/service-payment/${editingRecord._id}` : '/service-payment';
          recordData = {
            patientId: formData.patientId,
            serviceType: formData.serviceType,
            amount: parseFloat(formData.amount),
            paymentMethod: formData.paymentMethod,
            date: formData.date,
            description: formData.description,
            notes: formData.notes
          };
          break;
      }

      const method = editingRecord ? 'put' : 'post';
      const response = await crudRequest(method, endpoint, recordData);
      
      if ((response as any).success) {
        onSuccess?.((response as any).data);
        modalClose?.();
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || `Failed to save ${formType} record`);
    }
  };

  const getFormTitle = () => {
    const action = editingRecord ? 'Update' : 'Add';
    switch (formType) {
      case 'income': return `💰 ${action} Income Record`;
      case 'expense': return `💸 ${action} Expense Record`;
      case 'payment': return `💳 ${action} Service Payment`;
      default: return `${action} Financial Record`;
    }
  };

  const getFormIcon = () => {
    switch (formType) {
      case 'income': return TrendingUp;
      case 'expense': return TrendingDown;
      case 'payment': return CreditCard;
      default: return DollarSign;
    }
  };

  const getCategories = () => {
    switch (formType) {
      case 'income': return incomeCategories;
      case 'expense': return expenseCategories;
      default: return [];
    }
  };

  const getCategoryInfo = (category: string) => {
    const categories = getCategories();
    return categories.find(c => c.value === category);
  };

  const getPaymentMethodInfo = (method: string) => {
    return paymentMethods.find(pm => pm.value === method);
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setCalculatedTotal(amount);
  };

  const tabVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-violet-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto"
      >
        <DelightfulForm
          onSubmit={handleSubmit}
          title={getFormTitle()}
          submitLabel={editingRecord ? `Update ${formType}` : `Add ${formType}`}
          formType="financial"
          submitIcon={getFormIcon() as any}
          celebrateOnSuccess={true}
          playfulFeedback={true}
          className="w-full max-w-none"
        >
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText size={16} />
                Details
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard size={16} />
                Payment
              </TabsTrigger>
            </TabsList>

            <motion.div
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="details">
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="text-blue-500" size={20} />
                    <h3 className="font-semibold text-gray-900">Financial Details</h3>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description *
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder={`Enter ${formType} description`}
                      required
                      className="mt-1"
                      defaultValue={editingRecord?.description}
                    />
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                          className="mt-1 pl-10"
                          defaultValue={editingRecord?.amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                          id="date"
                          name="date"
                          type="date"
                          required
                          className="mt-1 pl-10"
                          defaultValue={editingRecord?.date?.split('T')[0] || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </motion.div>
                  </div>

                  {formType !== 'payment' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                      <Select
                        name="category"
                        required
                        onValueChange={setSelectedCategory}
                        defaultValue={editingRecord?.category}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {getCategories().map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              <div className="flex items-center gap-2">
                                <span>{category.emoji}</span>
                                <span>{category.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedCategory && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-2"
                        >
                          {(() => {
                            const categoryInfo = getCategoryInfo(selectedCategory);
                            return categoryInfo && (
                              <Badge className={categoryInfo.color}>
                                {categoryInfo.emoji} {categoryInfo.label}
                              </Badge>
                            );
                          })()}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {(formType === 'income' || formType === 'payment') && patients.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="patientId" className="text-sm font-medium">
                        {formType === 'payment' ? 'Patient *' : 'Patient (Optional)'}
                      </Label>
                      <Select name="patientId" required={formType === 'payment'}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient._id} value={patient._id}>
                              {patient.name} - {patient.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}

                  {formType === 'expense' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="vendor" className="text-sm font-medium">Vendor/Supplier</Label>
                      <Input
                        id="vendor"
                        name="vendor"
                        placeholder="Enter vendor name"
                        className="mt-1"
                        defaultValue={editingRecord?.vendor}
                      />
                    </motion.div>
                  )}

                  {formType === 'payment' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="serviceType" className="text-sm font-medium">Service Type *</Label>
                      <Input
                        id="serviceType"
                        name="serviceType"
                        placeholder="e.g., Consultation, Cleaning, Root Canal"
                        required
                        className="mt-1"
                        defaultValue={editingRecord?.serviceType}
                      />
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Add any additional notes or details..."
                      rows={3}
                      className="mt-1"
                      defaultValue={editingRecord?.notes}
                    />
                  </motion.div>
                </Card>
              </TabsContent>

              <TabsContent value="payment">
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="text-green-500" size={20} />
                    <h3 className="font-semibold text-gray-900">Payment Information</h3>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method *</Label>
                    <Select
                      name="paymentMethod"
                      required
                      onValueChange={setSelectedPaymentMethod}
                      defaultValue={editingRecord?.paymentMethod}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center gap-2">
                              <span>{method.emoji}</span>
                              <span>{method.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedPaymentMethod && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2"
                      >
                        {(() => {
                          const methodInfo = getPaymentMethodInfo(selectedPaymentMethod);
                          return methodInfo && (
                            <Badge className={methodInfo.color}>
                              {methodInfo.emoji} {methodInfo.label}
                            </Badge>
                          );
                        })()}
                      </motion.div>
                    )}
                  </motion.div>

                  {formType !== 'payment' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="isRecurring" className="text-sm font-medium">Recurring Transaction</Label>
                      <Select name="isRecurring" defaultValue={editingRecord?.isRecurring?.toString()}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Is this a recurring transaction?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">🔄 One-time Transaction</SelectItem>
                          <SelectItem value="true">🔁 Recurring Transaction</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}

                  {calculatedTotal > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="text-green-600" size={24} />
                          <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring", damping: 12, stiffness: 300 }}
                          className="text-2xl font-bold text-green-600"
                        >
                          ${calculatedTotal.toFixed(2)}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </TabsContent>
            </motion.div>
          </Tabs>
        </DelightfulForm>
      </motion.div>
    </div>
  );
};

export default DelightfulFinanceForm;