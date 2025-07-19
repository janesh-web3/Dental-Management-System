import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Trash2, RotateCcw, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getRecycleBinItems, 
  getRecycleBinStats, 
  restoreRecycleBinItem, 
  permanentlyDeleteRecycleBinItem, 
  emptyRecycleBin 
} from '@/lib/api';

interface RecycleBinItem {
  _id: string;
  type: string;
  deletedAt: string;
  deletedBy?: {
    name: string;
    email: string;
  };
  // Dynamic fields based on type
  [key: string]: any;
}

interface RecycleBinStats {
  total: number;
  breakdown: {
    patients: number;
    doctors: number;
    incomes: number;
    expenses: number;
    servicePayments: number;
    appointments: number;
    invoices: number;
  };
}

const RecycleBin: React.FC = () => {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [stats, setStats] = useState<RecycleBinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');

  const fetchRecycleBinData = async () => {
    try {
      // Fetch stats
      const statsData = await getRecycleBinStats();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch items
      const itemsData = await getRecycleBinItems(selectedTab);
      if (itemsData.success) {
        if (selectedTab === 'all') {
          // Flatten all items from different categories
          const allItems = [
            ...itemsData.data.patients || [],
            ...itemsData.data.doctors || [],
            ...itemsData.data.incomes || [],
            ...itemsData.data.expenses || [],
            ...itemsData.data.servicePayments || [],
            ...itemsData.data.appointments || [],
            ...itemsData.data.invoices || []
          ];
          setItems(allItems);
        } else {
          setItems(itemsData.data.items || []);
        }
      }
    } catch (error) {
      console.error('Error fetching recycle bin data:', error);
      toast.error('Failed to fetch recycle bin data');
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (type: string, id: string) => {
    try {
      const data = await restoreRecycleBinItem(type, id);
      if (data.success) {
        toast.success(`${type} restored successfully`);
        fetchRecycleBinData(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to restore item');
      }
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item');
    }
  };

  const permanentlyDeleteItem = async (type: string, id: string) => {
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      const data = await permanentlyDeleteRecycleBinItem(type, id);
      if (data.success) {
        toast.success(`${type} permanently deleted`);
        fetchRecycleBinData(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleEmptyRecycleBin = async () => {
    if (!confirm('Are you sure you want to empty the entire recycle bin? This action cannot be undone.')) {
      return;
    }

    try {
      const data = await emptyRecycleBin();
      if (data.success) {
        toast.success('Recycle bin emptied successfully');
        fetchRecycleBinData(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to empty recycle bin');
      }
    } catch (error) {
      console.error('Error emptying recycle bin:', error);
      toast.error('Failed to empty recycle bin');
    }
  };

  const getItemDisplayName = (item: RecycleBinItem) => {
    switch (item.type) {
      case 'patient':
        return item.personalDetails?.name || 'Unknown Patient';
      case 'doctor':
        return item.name || 'Unknown Doctor';
      case 'income':
      case 'expense':
        return item.title || 'Unknown';
      case 'servicePayment':
        return `${item.serviceType} - ${item.patientName}`;
      case 'appointment':
        return `${item.firstName} ${item.lastName}`;
      case 'invoice':
        return `Invoice ${item.invoiceNumber}`;
      default:
        return 'Unknown Item';
    }
  };

  useEffect(() => {
    fetchRecycleBinData();
  }, [selectedTab]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recycle Bin</h1>
          <p className="text-gray-600">Manage deleted items</p>
        </div>
        <Button 
          variant="destructive" 
          onClick={handleEmptyRecycleBin}
          disabled={!stats || stats.total === 0}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Empty Recycle Bin
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.breakdown.patients}</div>
              <div className="text-sm text-gray-600">Patients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.breakdown.doctors}</div>
              <div className="text-sm text-gray-600">Doctors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.breakdown.incomes}</div>
              <div className="text-sm text-gray-600">Incomes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.breakdown.expenses}</div>
              <div className="text-sm text-gray-600">Expenses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.breakdown.servicePayments}</div>
              <div className="text-sm text-gray-600">Payments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.breakdown.appointments}</div>
              <div className="text-sm text-gray-600">Appointments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.breakdown.invoices}</div>
              <div className="text-sm text-gray-600">Invoices</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for filtering by type */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="patient">Patients</TabsTrigger>
          <TabsTrigger value="doctor">Doctors</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="servicePayment">Service Payments</TabsTrigger>
          <TabsTrigger value="appointment">Appointments</TabsTrigger>
          <TabsTrigger value="invoice">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trash2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted items</h3>
                <p className="text-gray-600">The recycle bin is empty.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item._id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">{item.type}</Badge>
                          <h3 className="text-lg font-medium">{getItemDisplayName(item)}</h3>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Deleted: {new Date(item.deletedAt).toLocaleString()}</p>
                          {item.deletedBy && (
                            <p>Deleted by: {item.deletedBy.name} ({item.deletedBy.email})</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreItem(item.type, item._id)}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => permanentlyDeleteItem(item.type, item._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Forever
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecycleBin;