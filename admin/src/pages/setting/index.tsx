import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle } from "lucide-react"; // Add this import
import { useAdminContext } from "@/contexts/adminContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSettings } from "@/components/shared/NotificationSettings";
import { VoiceInputSettings } from "@/components/shared/VoiceInputSettings";
import UserPermissionForm from "@/components/user/UserPermissionForm";

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  contact: string;
  password?: string;
  avatar?: string;
}

const Setting = () => {
  const { adminDetails } = useAdminContext();
  const [userData, _setUserData] = useState<UserData>({
    _id: adminDetails._id,
    name: adminDetails.name,
    email: adminDetails.email,
    contact: adminDetails.contact,
    role: adminDetails.role,
    password: "",
    avatar: "https://github.com/shadcn.png",
  });
  
  // Add state for notification preferences
  interface NotificationPreferences {
    desktopNotifications: boolean;
    soundAlerts: boolean;
    appointmentNotifications: boolean;
    patientNotifications: boolean;
    treatmentNotifications: boolean;
    paymentNotifications: boolean;
    xrayNotifications: boolean;
    doctorNotifications: boolean;
    doctorAddedNotification?: boolean;
    doctorUpdatedNotification?: boolean;
    doctorDeletedNotification?: boolean;
  }
  // Extend the type of notificationPreferences in adminDetails to include the optional doctor notification fields
  type AdminDetailsWithNotifications = typeof adminDetails & {
    notificationPreferences?: NotificationPreferences;
  };
  const adminDetailsWithNotifications = adminDetails as AdminDetailsWithNotifications;

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    desktopNotifications: adminDetailsWithNotifications.notificationPreferences?.desktopNotifications ?? true,
    soundAlerts: adminDetailsWithNotifications.notificationPreferences?.soundAlerts ?? true,
    appointmentNotifications: adminDetailsWithNotifications.notificationPreferences?.appointmentNotifications ?? true,
    patientNotifications: adminDetailsWithNotifications.notificationPreferences?.patientNotifications ?? true,
    treatmentNotifications: adminDetailsWithNotifications.notificationPreferences?.treatmentNotifications ?? true,
    paymentNotifications: adminDetailsWithNotifications.notificationPreferences?.paymentNotifications ?? true,
    xrayNotifications: adminDetailsWithNotifications.notificationPreferences?.xrayNotifications ?? true,
    doctorNotifications: adminDetailsWithNotifications.notificationPreferences?.doctorNotifications ?? true,
    doctorAddedNotification: adminDetailsWithNotifications.notificationPreferences?.doctorAddedNotification ?? true,
    doctorUpdatedNotification: adminDetailsWithNotifications.notificationPreferences?.doctorUpdatedNotification ?? true,
    doctorDeletedNotification: adminDetailsWithNotifications.notificationPreferences?.doctorDeletedNotification ?? true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData>(userData);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);

  // Add this state after other state declarations
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Modify the handleUpdate function
  const handleUpdate = async () => {
    try {
      const updateData = {
        ...editedData,
        ...(showPasswordUpdate && newPassword ? { password: newPassword } : {}),
      };

      const response = await crudRequest(
        "PUT",
        `/user/update-user/${editedData._id}`,
        updateData
      );

      if (response) {
        setUsers(
          users.map((user) =>
            user._id === editedData._id ? (response as UserData) : user
          )
        );
        setIsEditing(false);
        setShowPasswordUpdate(false);
        setNewPassword("");
        toast.success("User updated successfully");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update user");
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    try {
      const response = await crudRequest(
        "DELETE",
        `/user/delete-user/${userId}`
      );

      if (response) {
        // Remove user from the list
        setUsers(users.filter((user) => user._id !== userId));
        toast.success(`${userName} deleted successfully`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await crudRequest("POST", "/user/create-user", userData);
      if (response) {
        setIsCreatingUser(false);
        toast.success("User created successfully");
        // Refresh the users list
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingUser(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await crudRequest<{ data: UserData[] }>(
        "GET",
        "/user/get-users"
      );
      if (response) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Dialog open={isCreatingUser} onOpenChange={setIsCreatingUser}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserPermissionForm
              onSubmit={handleCreateUser}
              onCancel={handleCancelCreate}
              loading={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="profile" className="w-full mb-6">        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="recycle-bin">Recycle Bin</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-4">
          <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userData.avatar} />
              <AvatarFallback>{userData.name[0]}</AvatarFallback>
            </Avatar>

            <div className="space-y-4 flex-1">
              <div className="grid gap-4 mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={isEditing ? editedData.name : userData.name}
                    onChange={(e) =>
                      setEditedData({ ...editedData, name: e.target.value })
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? editedData.email : userData.email}
                    onChange={(e) =>
                      setEditedData({ ...editedData, email: e.target.value })
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    type="text"
                    value={isEditing ? editedData.contact : userData.contact}
                    onChange={(e) =>
                      setEditedData({ ...editedData, contact: e.target.value })
                    }
                    readOnly={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={isEditing ? editedData.role : userData.role}
                    onChange={(e) =>
                      setEditedData({ ...editedData, role: e.target.value })
                    }
                    readOnly={!isEditing}
                  />
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowPasswordUpdate(!showPasswordUpdate)
                        }
                      >
                        {showPasswordUpdate
                          ? "Cancel Password Update"
                          : "Update Password"}
                      </Button>
                    </div>
                    {showPasswordUpdate && (
                      <Input
                        id="password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleUpdate}>Save Changes</Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedData(userData);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you sure?</DialogTitle>
                    </DialogHeader>
                    <p>This action cannot be undone.</p>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="destructive"
                        onClick={() =>
                          handleDelete(userData._id, userData.name)
                        }
                      >
                        Delete
                      </Button>
                      {/* <Button variant="outline">Cancel</Button> */}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      </TabsContent>
          <TabsContent value="notifications" className="mt-4">
        <NotificationSettings 
          userId={adminDetails._id} 
          userType="User"
          initialPreferences={{
            ...notificationPreferences,
            doctorAddedNotification: notificationPreferences.doctorAddedNotification ?? false,
            doctorUpdatedNotification: notificationPreferences.doctorUpdatedNotification ?? false,
            doctorDeletedNotification: notificationPreferences.doctorDeletedNotification ?? false,
          }}
          onSaved={(prefs) => setNotificationPreferences(prefs)}
        />
      </TabsContent>
      
      <TabsContent value="advanced" className="mt-4">
        <div className="space-y-4">
          <VoiceInputSettings />
        </div>
      </TabsContent>
      
      <TabsContent value="users" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.contact}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditedData(user);
                            setIsEditing(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                            </DialogHeader>
                            <p>Are you sure you want to delete {user.name}?</p>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(user._id, user.name)}
                              >
                                Delete
                              </Button>
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="recycle-bin" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Recycle Bin</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This feature is under development.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  );
};

export default Setting;
