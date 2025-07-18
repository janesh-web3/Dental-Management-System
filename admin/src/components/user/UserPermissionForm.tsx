import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Shield,
  Database,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface Permissions {
  dashboard: {
    fullAccess: boolean;
    basicAccess: boolean;
    analytics: boolean;
    reports: boolean;
  };
  users: Permission;
  patients: Permission;
  doctors: Permission;
  appointments: Permission;
  income: Permission;
  expenses: Permission;
  contacts: Permission;
  settings: {
    access: boolean;
    configure: boolean;
  };
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  contact: string;
  permissions: Permissions;
}

interface UserPermissionFormProps {
  user?: any;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
  loading?: boolean;
}

const UserPermissionForm: React.FC<UserPermissionFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isEditing = false,
  loading = false,
}) => {
  const { t } = useTranslation();

  const defaultPermissions: Permissions = {
    dashboard: { fullAccess: false, basicAccess: true, analytics: false, reports: false },
    users: { create: false, read: false, update: false, delete: false },
    patients: { create: true, read: true, update: true, delete: false },
    doctors: { create: false, read: true, update: false, delete: false },
    appointments: { create: true, read: true, update: true, delete: false },
    income: { create: true, read: true, update: true, delete: false },
    expenses: { create: true, read: true, update: true, delete: false },
    contacts: { create: true, read: true, update: true, delete: false },
    settings: { access: false, configure: false },
  };

  const adminPermissions: Permissions = {
    dashboard: { fullAccess: true, basicAccess: true, analytics: true, reports: true },
    users: { create: true, read: true, update: true, delete: true },
    patients: { create: true, read: true, update: true, delete: true },
    doctors: { create: true, read: true, update: true, delete: true },
    appointments: { create: true, read: true, update: true, delete: true },
    income: { create: true, read: true, update: true, delete: true },
    expenses: { create: true, read: true, update: true, delete: true },
    contacts: { create: true, read: true, update: true, delete: true },
    settings: { access: true, configure: true },
  };

  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "staff",
    contact: user?.contact || "",
    permissions: user?.permissions || defaultPermissions,
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "staff",
        contact: user.contact || "",
        permissions: user.permissions || defaultPermissions,
      });
    }
  }, [user]);

  const handleRoleChange = (newRole: string) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: newRole === 'admin' ? adminPermissions : defaultPermissions,
    }));
  };

  const handlePermissionChange = (entity: keyof Permissions, action: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: {
          ...prev.permissions[entity],
          [action]: value,
        },
      },
    }));
  };

  const handleCRUDPermissionChange = (entity: keyof Permissions, action: keyof Permission, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [entity]: {
          ...prev.permissions[entity] as Permission,
          [action]: value,
        },
      },
    }));
  };

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return t("Name is required");
        if (value.length < 3) return t("Name must be at least 3 characters");
        break;
      case 'email':
        if (!value.trim()) return t("Email is required");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return t("Please enter a valid email address");
        break;
      case 'contact':
        if (!value.trim()) return t("Contact is required");
        const contactRegex = /^\d{10,15}$/;
        if (!contactRegex.test(value.replace(/\s/g, ''))) return t("Please enter a valid contact number (10-15 digits)");
        break;
      case 'password':
        if (!isEditing && !value.trim()) return t("Password is required");
        if (value && value.length < 6) return t("Password must be at least 6 characters");
        break;
    }
    return "";
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors: Record<string, string> = {};
    
    ['name', 'email', 'contact', 'password'].forEach(field => {
      const error = validateField(field, formData[field as keyof UserFormData] as string);
      if (error) {
        errors[field] = error;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setActiveTab("basic"); // Switch to basic tab to show errors
      return;
    }
    
    onSubmit(formData);
  };

  const permissionEntities = [
    { key: 'patients', label: t('Patients'), icon: Users, color: 'text-blue-600' },
    { key: 'doctors', label: t('Doctors'), icon: Shield, color: 'text-green-600' },
    { key: 'appointments', label: t('Appointments'), icon: Calendar, color: 'text-purple-600' },
    { key: 'income', label: t('Income'), icon: DollarSign, color: 'text-emerald-600' },
    { key: 'expenses', label: t('Expenses'), icon: FileText, color: 'text-red-600' },
    { key: 'contacts', label: t('Contacts'), icon: Database, color: 'text-orange-600' },
  ];

  const getPermissionSummary = () => {
    const summary = {
      total: 0,
      granted: 0,
      entities: [] as string[],
    };

    permissionEntities.forEach(entity => {
      const perms = formData.permissions[entity.key as keyof Permissions] as Permission;
      const entityPermissions = Object.values(perms).filter(Boolean).length;
      summary.total += 4; // CRUD permissions
      summary.granted += entityPermissions;
      if (entityPermissions > 0) {
        summary.entities.push(entity.label);
      }
    });

    return summary;
  };

  const permissionSummary = getPermissionSummary();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">{t("Basic Info")}</TabsTrigger>
          <TabsTrigger value="permissions">{t("Permissions")}</TabsTrigger>
          <TabsTrigger value="summary">{t("Summary")}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t("Full Name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder={t("Enter full name")}
                required
                className={fieldErrors.name ? "border-red-500" : ""}
              />
              {fieldErrors.name && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">{t("Email Address")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder={t("Enter email address")}
                required
                className={fieldErrors.email ? "border-red-500" : ""}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="contact">{t("Contact Number")}</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleFieldChange('contact', e.target.value)}
                placeholder={t("Enter contact number")}
                required
                className={fieldErrors.contact ? "border-red-500" : ""}
              />
              {fieldErrors.contact && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.contact}</p>
              )}
            </div>
            <div>
              <Label htmlFor="role">{t("User Role")}</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("Staff")}
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t("Admin")}
                    </div>
                  </SelectItem>
                  <SelectItem value="dentist">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t("Dentist")}
                    </div>
                  </SelectItem>
                  <SelectItem value="doctor">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t("Doctor")}
                    </div>
                  </SelectItem>
                  <SelectItem value="reception">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("Reception")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="password">
              {isEditing ? t("New Password (optional)") : t("Password")}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              placeholder={
                isEditing 
                  ? t("Leave blank to keep current password") 
                  : t("Enter password")
              }
              required={!isEditing}
              className={fieldErrors.password ? "border-red-500" : ""}
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {formData.role === 'admin' 
                ? t("Admin users have full access to all system features. Individual permissions are automatically granted.")
                : t("Configure specific permissions for this user. These permissions will determine what features they can access.")
              }
            </AlertDescription>
          </Alert>

          {/* Dashboard Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                {t("Dashboard Permissions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("Full Dashboard Access")}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Access to all analytics, reports, and advanced features")}
                  </p>
                </div>
                <Switch
                  checked={formData.permissions.dashboard.fullAccess}
                  onCheckedChange={(value) => handlePermissionChange('dashboard', 'fullAccess', value)}
                  disabled={formData.role === 'admin'}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("Analytics")}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Access to analytics and reporting features")}
                  </p>
                </div>
                <Switch
                  checked={formData.permissions.dashboard.analytics}
                  onCheckedChange={(value) => handlePermissionChange('dashboard', 'analytics', value)}
                  disabled={formData.role === 'admin'}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("Reports")}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Access to generate and view reports")}
                  </p>
                </div>
                <Switch
                  checked={formData.permissions.dashboard.reports}
                  onCheckedChange={(value) => handlePermissionChange('dashboard', 'reports', value)}
                  disabled={formData.role === 'admin'}
                />
              </div>
            </CardContent>
          </Card>

          {/* User Management Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                {t("User Management")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['create', 'read', 'update', 'delete'] as const).map((action) => (
                  <div key={action} className="flex items-center space-x-2">
                    <Switch
                      checked={formData.permissions.users[action]}
                      onCheckedChange={(value) => handleCRUDPermissionChange('users', action, value)}
                      disabled={formData.role === 'admin'}
                    />
                    <Label className="capitalize">{t(action)}</Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("User management permissions allow creating, viewing, editing, and deleting user accounts.")}
              </p>
            </CardContent>
          </Card>

          {/* Entity Permissions */}
          <div className="grid gap-4">
            {permissionEntities.map((entity) => {
              const IconComponent = entity.icon;
              return (
                <Card key={entity.key}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${entity.color}`}>
                      <IconComponent className="h-5 w-5" />
                      {entity.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(['create', 'read', 'update', 'delete'] as const).map((action) => (
                        <div key={action} className="flex items-center space-x-2">
                          <Switch
                            checked={
                              (formData.permissions[entity.key as keyof Permissions] as Permission)[action]
                            }
                            onCheckedChange={(value) => 
                              handleCRUDPermissionChange(entity.key as keyof Permissions, action, value)
                            }
                            disabled={formData.role === 'admin'}
                          />
                          <Label className="capitalize">{t(action)}</Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Settings Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                {t("System Settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("Access Settings")}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Can view system settings")}
                  </p>
                </div>
                <Switch
                  checked={formData.permissions.settings.access}
                  onCheckedChange={(value) => handlePermissionChange('settings', 'access', value)}
                  disabled={formData.role === 'admin'}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t("Configure Settings")}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Can modify system settings")}
                  </p>
                </div>
                <Switch
                  checked={formData.permissions.settings.configure}
                  onCheckedChange={(value) => handlePermissionChange('settings', 'configure', value)}
                  disabled={formData.role === 'admin'}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {t("User Summary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Name")}
                  </Label>
                  <p className="text-sm">{formData.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Email")}
                  </Label>
                  <p className="text-sm">{formData.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Contact")}
                  </Label>
                  <p className="text-sm">{formData.contact}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Role")}
                  </Label>
                  <Badge className="mt-1">
                    {formData.role === 'admin' ? t('Admin') : 
                     formData.role === 'staff' ? t('Staff') : 
                     formData.role === 'dentist' ? t('Dentist') : 
                     formData.role === 'doctor' ? t('Doctor') : 
                     formData.role === 'reception' ? t('Reception') : t('Staff')}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  {t("Permission Summary")}
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{t("Total Permissions")}</span>
                    <span className="text-sm font-medium">{permissionSummary.granted} / {permissionSummary.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(permissionSummary.granted / permissionSummary.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {permissionSummary.entities.map((entity) => (
                      <Badge key={entity} variant="outline" className="text-xs">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {formData.role === 'admin' && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    {t("This user will have full administrative access to all system features.")}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t("Saving...") : isEditing ? t("Update User") : t("Create User")}
        </Button>
      </div>
    </form>
  );
};

export default UserPermissionForm;