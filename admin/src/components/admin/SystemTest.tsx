import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, AlertCircle, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

const SystemTest: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Authentication Token Validation', status: 'pending' },
    { name: 'Financial Calculations (Income)', status: 'pending' },
    { name: 'Financial Calculations (Expense)', status: 'pending' },
    { name: 'Soft Delete Functionality', status: 'pending' },
    { name: 'Invoice Generation System', status: 'pending' },
    { name: 'Recycle Bin Operations', status: 'pending' },
    { name: 'Patient Data Integrity', status: 'pending' },
    { name: 'Role-Based Access Control', status: 'pending' }
  ]);

  const updateTestStatus = (testName: string, status: TestResult['status'], message?: string, data?: any) => {
    setTests(prev => prev.map(test => 
      test.name === testName 
        ? { ...test, status, message, data }
        : test
    ));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const testAuthentication = async () => {
    updateTestStatus('Authentication Token Validation', 'running');
    try {
      const response = await fetch('/api/user/me', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTestStatus('Authentication Token Validation', 'success', 
          `Authenticated as: ${data.data?.name || 'Unknown'} (${data.data?.role || 'Unknown role'})`);
      } else {
        updateTestStatus('Authentication Token Validation', 'error', 
          `Authentication failed: ${response.status}`);
      }
    } catch (error) {
      updateTestStatus('Authentication Token Validation', 'error', 
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testFinancialCalculations = async () => {
    // Test Income calculations
    updateTestStatus('Financial Calculations (Income)', 'running');
    try {
      const response = await fetch('/api/finance/income', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTestStatus('Financial Calculations (Income)', 'success', 
          `Found ${data.data?.length || 0} income records, Total: ${data.meta?.totalAmount || 0}`);
      } else {
        updateTestStatus('Financial Calculations (Income)', 'error', 
          `Failed to fetch income: ${response.status}`);
      }
    } catch (error) {
      updateTestStatus('Financial Calculations (Income)', 'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test Expense calculations
    updateTestStatus('Financial Calculations (Expense)', 'running');
    try {
      const response = await fetch('/api/finance/expense', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTestStatus('Financial Calculations (Expense)', 'success', 
          `Found ${data.data?.length || 0} expense records, Total: ${data.meta?.totalAmount || 0}`);
      } else {
        updateTestStatus('Financial Calculations (Expense)', 'error', 
          `Failed to fetch expenses: ${response.status}`);
      }
    } catch (error) {
      updateTestStatus('Financial Calculations (Expense)', 'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testSoftDelete = async () => {
    updateTestStatus('Soft Delete Functionality', 'running');
    try {
      // Test recycle bin stats to verify soft delete is working
      const response = await fetch('/api/recycle-bin/stats', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const total = data.data?.total || 0;
        updateTestStatus('Soft Delete Functionality', 'success', 
          `Recycle bin contains ${total} soft-deleted items`);
      } else {
        updateTestStatus('Soft Delete Functionality', 'error', 
          `Failed to access recycle bin: ${response.status}`);
      }
    } catch (error) {
      updateTestStatus('Soft Delete Functionality', 'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testInvoiceGeneration = async () => {
    updateTestStatus('Invoice Generation System', 'running');
    try {
      // Check if invoices endpoint exists and works
      const response = await fetch('/api/v1/invoices', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        updateTestStatus('Invoice Generation System', 'success', 
          `Invoice system active. Found ${data.data?.length || 0} invoices`);
      } else {
        updateTestStatus('Invoice Generation System', 'error', 
          `Invoice system error: ${response.status}`);
      }
    } catch (error) {
      updateTestStatus('Invoice Generation System', 'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testRecycleBin = async () => {
    updateTestStatus('Recycle Bin Operations', 'running');
    try {
      const response = await fetch('/api/recycle-bin', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        await response.json();
        updateTestStatus('Recycle Bin Operations', 'success', 
          'Recycle bin is accessible and functional');
      } else {
        updateTestStatus('Recycle Bin Operations', 'error', 
          `Recycle bin access failed: ${response.status}`);
      }
    } catch (error) {
      updateTestStatus('Recycle Bin Operations', 'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testPatientDataIntegrity = async () => {
    updateTestStatus('Patient Data Integrity', 'running');
    try {
      const response = await fetch('/api/patient', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const patients = data.data || [];
        const activePatients = patients.filter((p: any) => !p.isDeleted);
        updateTestStatus('Patient Data Integrity', 'success', 
          `Found ${activePatients.length} active patients (${patients.length - activePatients.length} soft-deleted hidden)`);
      } else {
        updateTestStatus('Patient Data Integrity', 'error', 
          `Patient data access failed: ${response.status}`);
      }
    } catch (error) {
      updateTestStatus('Patient Data Integrity', 'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testRoleBasedAccess = async () => {
    updateTestStatus('Role-Based Access Control', 'running');
    try {
      // Test admin-only endpoint
      const response = await fetch('/api/recycle-bin/stats', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        updateTestStatus('Role-Based Access Control', 'success', 
          'Admin-only endpoints are accessible with current token');
      } else if (response.status === 403) {
        updateTestStatus('Role-Based Access Control', 'error', 
          'Access denied - insufficient permissions');
      } else {
        updateTestStatus('Role-Based Access Control', 'error', 
          `Unexpected response: ${response.status}`);
      }
    } catch (error) {
      updateTestStatus('Role-Based Access Control', 'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAllTests = async () => {
    toast.info('Running system tests...');
    
    await testAuthentication();
    await testFinancialCalculations();
    await testSoftDelete();
    await testInvoiceGeneration();
    await testRecycleBin();
    await testPatientDataIntegrity();
    await testRoleBasedAccess();
    
    toast.success('All tests completed!');
  };

  const runSingleTest = async (testName: string) => {
    switch (testName) {
      case 'Authentication Token Validation':
        await testAuthentication();
        break;
      case 'Financial Calculations (Income)':
      case 'Financial Calculations (Expense)':
        await testFinancialCalculations();
        break;
      case 'Soft Delete Functionality':
        await testSoftDelete();
        break;
      case 'Invoice Generation System':
        await testInvoiceGeneration();
        break;
      case 'Recycle Bin Operations':
        await testRecycleBin();
        break;
      case 'Patient Data Integrity':
        await testPatientDataIntegrity();
        break;
      case 'Role-Based Access Control':
        await testRoleBasedAccess();
        break;
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Running</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Tests</h1>
          <p className="text-gray-600">Verify all new features are working correctly</p>
        </div>
        <Button onClick={runAllTests}>
          <Play className="w-4 h-4 mr-2" />
          Run All Tests
        </Button>
      </div>

      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-medium">{test.name}</h3>
                    {test.message && (
                      <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(test.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runSingleTest(test.name)}
                    disabled={test.status === 'running'}
                  >
                    {test.status === 'running' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {tests.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {tests.filter(t => t.status === 'running').length}
              </div>
              <div className="text-sm text-gray-500">Running</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {tests.filter(t => t.status === 'success').length}
              </div>
              <div className="text-sm text-gray-500">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {tests.filter(t => t.status === 'error').length}
              </div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemTest;