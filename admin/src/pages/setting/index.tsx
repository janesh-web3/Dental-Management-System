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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSettings } from "@/components/shared/NotificationSettings";

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
  const [notificationPreferences, setNotificationPreferences] = useState(
    adminDetails.notificationPreferences || {
      desktopNotifications: true,
      soundAlerts: true,
      appointmentNotifications: true,
      patientNotifications: true,
      treatmentNotifications: true,
      paymentNotifications: true,
      xrayNotifications: true,
    }
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData>(userData);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState<Omit<UserData, "_id">>({
    name: "",
    email: "",
    contact: "",
    role: "",
    password: "",
    avatar: "",
  });
  const [users, setUsers] = useState<UserData[]>([
    {
      _id: "1",
      name: "John Doe",
      email: "john@example.com",
      contact: "1234567890",
      role: "Admin",
      avatar: "https://github.com/shadcn.png",
    },
    // Add more sample users as needed
  ]);

  // Add these state declarations after existing states
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    role: "",
  });

  // Add this validation function before handleCreateUser
  const validateForm = () => {
    const errors = {
      name: !newUser.name ? "Name is required" : "",
      email: !newUser.email ? "Email is required" : "",
      password: !newUser.password ? "Password is required" : "",
      contact: !newUser.contact ? "Contact is required" : "",
      role: !newUser.role ? "Role is required" : "",
    };

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

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

  const handleCreateUser = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }
    const data = {
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      contact: newUser.contact,
    };

    const response = await crudRequest("POST", "/user/add-user", data);
    if (response) {
      setIsCreatingUser(false);
      setNewUser({
        name: "",
        email: "",
        role: "",
        avatar: "",
        contact: "",
        password: "",
      });
      toast.success("User created successfully");
    } else {
      toast.error("Failed to create user: ");
    }
  };

  useEffect(() => {
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newName">Name</Label>
                <Input
                  id="newName"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="text"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="newContact">Contact</Label>
                <Input
                  id="newContact"
                  value={newUser.contact}
                  onChange={(e) =>
                    setNewUser({ ...newUser, contact: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newRole">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger
                    id="newRole"
                    className={formErrors.role ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="reception">Reception</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.role && (
                  <p className="text-sm text-red-500">{formErrors.role}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button onClick={handleCreateUser}>Create User</Button>
              <Button
                variant="outline"
                onClick={() => setIsCreatingUser(false)}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="profile" className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
          initialPreferences={notificationPreferences}
          onSaved={(prefs) => setNotificationPreferences(prefs)}
        />
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
    </Tabs>
    </div>
  );
};

export default Setting;
