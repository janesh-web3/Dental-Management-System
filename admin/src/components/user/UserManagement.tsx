import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAdminContext } from "@/contexts/adminContext";
import { crudRequest } from "@/lib/api";
import { server } from "@/server";
import { format } from "date-fns";
import UserPermissionForm from "./UserPermissionForm";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  contact: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions?: {
    dashboard: {
      fullAccess: boolean;
      basicAccess: boolean;
      analytics: boolean;
      reports: boolean;
    };
    users: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
    };
    [key: string]: any;
  };
}

const UserManagement = () => {
  const { t } = useTranslation();
  const { hasPermission, isAdmin } = useAdminContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check permissions
  if (!hasPermission('users', 'read')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("You don't have permission to access user management.")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await crudRequest<{ data: User[] }>("GET", `${server}/user/get-users`);
      setUsers(response.data);
    } catch (error) {
      setMessage({ type: "error", text: t("Failed to fetch users") });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      setFormLoading(true);
      await crudRequest("POST", `${server}/user/create-user`, userData);
      setMessage({ type: "success", text: t("User created successfully") });
      setShowCreateDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || t("Failed to create user") });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (userData: any) => {
    if (!selectedUser) return;
    
    try {
      setFormLoading(true);
      await crudRequest("PUT", `${server}/user/update-user/${selectedUser._id}`, userData);
      setMessage({ type: "success", text: t("User updated successfully") });
      setShowEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || t("Failed to update user") });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await crudRequest("PATCH", `${server}/user/toggle-status/${userId}`);
      setMessage({ type: "success", text: t("User status updated") });
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || t("Failed to update user status") });
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await crudRequest("PATCH", `${server}/user/change-role/${userId}`, { role: newRole });
      setMessage({ type: "success", text: t("User role updated") });
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || t("Failed to update user role") });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(t("Are you sure you want to delete this user?"))) return;
    
    try {
      await crudRequest("DELETE", `${server}/user/delete-user/${userId}`);
      setMessage({ type: "success", text: t("User deleted successfully") });
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || t("Failed to delete user") });
    }
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setShowCreateDialog(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const openViewDialog = (user: User) => {
    setSelectedUser(user);
    setShowViewDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setSelectedUser(null);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "staff":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "dentist":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "doctor":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "reception":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("User Management")}</h2>
          <p className="text-muted-foreground">{t("Manage system users and their permissions")}</p>
        </div>
        {hasPermission('users', 'create') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="h-4 w-4 mr-2" />
                {t("Add User")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("Create New User")}</DialogTitle>
              </DialogHeader>
              <UserPermissionForm
                onSubmit={handleCreateUser}
                onCancel={handleCloseCreateDialog}
                loading={formLoading}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t("All Users")} ({users.length})</TabsTrigger>
          <TabsTrigger value="admin">{t("Admins")} ({users.filter(u => u.role === 'admin').length})</TabsTrigger>
          <TabsTrigger value="staff">{t("Staff")} ({users.filter(u => u.role === 'staff').length})</TabsTrigger>
          <TabsTrigger value="inactive">{t("Inactive")} ({users.filter(u => !u.isActive).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(user.isActive)}
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                      {user.lastLogin && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(user.lastLogin), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {hasPermission('users', 'update') && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={() => handleToggleUserStatus(user._id)}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {user.isActive ? t("Active") : t("Inactive")}
                            </span>
                          </div>
                        </>
                      )}
                      {hasPermission('users', 'delete') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <div className="grid gap-4">
            {users.filter(u => u.role === 'admin').map((user) => (
              <Card key={user._id} className="hover:shadow-md transition-shadow border-red-200 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {t("Administrator")}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openViewDialog(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid gap-4">
            {users.filter(u => u.role === 'staff').map((user) => (
              <Card key={user._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(user.isActive)}
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {t("Staff")}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => openViewDialog(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {hasPermission('users', 'update') && (
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid gap-4">
            {users.filter(u => !u.isActive).map((user) => (
              <Card key={user._id} className="hover:shadow-md transition-shadow opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{t("Inactive")}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasPermission('users', 'update') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user._id)}
                        >
                          {t("Activate")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Edit User")}</DialogTitle>
          </DialogHeader>
          <UserPermissionForm
            user={selectedUser}
            onSubmit={handleUpdateUser}
            onCancel={handleCloseEditDialog}
            isEditing={true}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("User Details")}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Name")}</Label>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Email")}</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Contact")}</Label>
                  <p className="text-sm">{selectedUser.contact}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Role")}</Label>
                  <Badge className={getRoleColor(selectedUser.role)}>{selectedUser.role}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Status")}</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedUser.isActive)}
                    <span className="text-sm">{selectedUser.isActive ? t("Active") : t("Inactive")}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("Created")}</Label>
                  <p className="text-sm">{format(new Date(selectedUser.createdAt), "MMM d, yyyy HH:mm")}</p>
                </div>
              </div>
              
              {selectedUser.permissions && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">{t("Permissions")}</Label>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {Object.entries(selectedUser.permissions).map(([entity, perms]) => (
                          <div key={entity} className="flex items-center justify-between py-1">
                            <span className="text-sm capitalize">{entity}</span>
                            <div className="flex space-x-2">
                              {typeof perms === 'object' && Object.entries(perms).map(([action, allowed]) => (
                                <Badge 
                                  key={action} 
                                  variant={allowed ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;