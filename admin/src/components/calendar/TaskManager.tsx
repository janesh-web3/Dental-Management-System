import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  CheckSquare,
  Clock,
  User,
  Plus,
  Filter,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIcon,
  Stethoscope,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { crudRequest } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const taskSchema = z.object({
  appointmentId: z.string().min(1, "Appointment is required"),
  description: z.string().min(1, "Task description is required"),
  assignedTo: z.string().min(1, "Assignment is required"),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.enum(['preparation', 'equipment', 'followup', 'documentation', 'other']).default('preparation'),
  dueDate: z.date().optional(),
  estimatedDuration: z.number().min(5, "Duration must be at least 5 minutes").default(15),
  notes: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskManagerProps {
  onTaskUpdated?: () => void;
}

interface Task {
  _id: string;
  appointmentId: string;
  description: string;
  assignedTo: {
    _id: string;
    name: string;
    role: string;
  };
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  completedAt?: string;
  dueDate?: string;
  estimatedDuration: number;
  notes?: string;
  appointment: {
    _id: string;
    firstName: string;
    lastName: string;
    appointmentDate: string;
    appointmentTime: string;
    treatmentType: string;
    doctor: {
      name: string;
    };
  };
  createdAt: string;
}

interface Staff {
  _id: string;
  name: string;
  role: string;
}

interface UpcomingAppointment {
  _id: string;
  firstName: string;
  lastName: string;
  appointmentDate: string;
  appointmentTime: string;
  treatmentType: string;
  doctor: {
    _id: string;
    name: string;
  };
}

const taskCategories = [
  { value: 'preparation', label: 'Room Preparation', icon: '🏥' },
  { value: 'equipment', label: 'Equipment Setup', icon: '🔧' },
  { value: 'followup', label: 'Follow-up', icon: '📞' },
  { value: 'documentation', label: 'Documentation', icon: '📋' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const TaskManager: React.FC<TaskManagerProps> = ({
  onTaskUpdated
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      category: 'preparation',
      estimatedDuration: 15,
    },
  });

  useEffect(() => {
    fetchTasks();
    fetchStaff();
    fetchUpcomingAppointments();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await crudRequest("GET", "/appointment/tasks");
      if (response) {
        setTasks(response);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await crudRequest("GET", "/user/staff");
      if (response) {
        setStaff(response);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await crudRequest("GET", `/appointment/get-appointments?calendar=true&startDate=${today}`);
      if (response) {
        const upcoming = response
          .filter((apt: any) => new Date(apt.appointmentDate) >= new Date())
          .slice(0, 20);
        setUpcomingAppointments(upcoming);
      }
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
    }
  };

  const handleCreateTask = async (data: TaskFormValues) => {
    try {
      const response = await crudRequest("POST", "/appointment/tasks", data);
      
      if (response) {
        toast({
          title: "Task Created",
          description: "Task has been assigned successfully",
          variant: "default",
        });
        
        setIsOpen(false);
        form.reset();
        fetchTasks();
        onTaskUpdated?.();
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const response = await crudRequest("PUT", `/appointment/tasks/${taskId}`, {
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      });

      if (response) {
        toast({
          title: completed ? "Task Completed" : "Task Reopened",
          description: `Task has been ${completed ? 'marked as complete' : 'reopened'}`,
          variant: "default",
        });
        
        fetchTasks();
        onTaskUpdated?.();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const getTasksByCategory = (category: string) => {
    return filteredTasks.filter(task => task.category === category);
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'pending' && task.completed) return false;
    if (filterStatus === 'completed' && !task.completed) return false;
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    if (filterAssignee !== 'all' && task.assignedTo._id !== filterAssignee) return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = taskCategories.find(c => c.value === category);
    return cat?.icon || '📝';
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => 
      !t.completed && 
      t.dueDate && 
      new Date(t.dueDate) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Management</h2>
          <p className="text-muted-foreground">Manage staff preparation tasks and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTasks} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Assign a task to staff for appointment preparation
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateTask)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="appointmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Appointment</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select appointment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {upcomingAppointments.map((apt) => (
                              <SelectItem key={apt._id} value={apt._id}>
                                {apt.firstName} {apt.lastName} - {apt.treatmentType} 
                                ({format(new Date(apt.appointmentDate), 'MMM dd')} at {apt.appointmentTime})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what needs to be done..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {taskCategories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.icon} {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign To</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select staff member" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {staff.map((member) => (
                                <SelectItem key={member._id} value={member._id}>
                                  {member.name} ({member.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Est. Duration (min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              field.onChange(date);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional instructions or notes..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit">Create Task</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {taskCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Assignee</label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {taskCategories.map((category) => {
          const categoryTasks = getTasksByCategory(category.value);
          if (categoryTasks.length === 0) return null;

          return (
            <Card key={category.value}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-xl">{category.icon}</span>
                  {category.label} ({categoryTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryTasks.map((task) => (
                    <div key={task._id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => 
                              handleToggleTask(task._id, !!checked)
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.description}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {task.assignedTo.name}
                              </Badge>
                              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                              {task.estimatedDuration && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {task.estimatedDuration}min
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {task.appointment.firstName} {task.appointment.lastName} - 
                              {task.appointment.treatmentType} on {format(new Date(task.appointment.appointmentDate), 'MMM dd')}
                            </p>
                            {task.dueDate && (
                              <p className="text-xs text-muted-foreground">
                                Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No tasks found</p>
              <p className="text-sm">Create tasks to help staff prepare for appointments</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskManager;