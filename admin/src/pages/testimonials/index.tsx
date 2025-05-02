import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crudRequest } from "@/lib/api";
import { toast } from "react-toastify";
import { useAdminContext } from "@/contexts/adminContext";

interface Testimonial {
  _id: string;
  name: string;
  feedback: string;
  location: string;
  image: string;
}

interface FormData {
  name: string;
  feedback: string;
  location: string;
  image: File | null;
}

const TestimonialsAdmin = () => {
  const { adminDetails } = useAdminContext();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    feedback: "",
    location: "",
    image: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch testimonials
  const fetchTestimonials = async () => {
    try {
      const response = await crudRequest<Testimonial[]>(
        "GET",
        "/testimonials/get-all"
      );
      setTestimonials(response);
    } catch (error) {
      toast.error("Failed to fetch testimonials");
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = {
        name: formData.name,
        feedback: formData.feedback,
        location: formData.location,
        image: formData.image,
      };
      console.log(formDataToSend);

      if (editingId) {
        await crudRequest(
          "PUT",
          `/testimonials/edit/${editingId}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Testimonial updated successfully");
      } else {
        await crudRequest("POST", "/testimonials/create", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Testimonial added successfully");
      }

      setIsModalOpen(false);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      toast.error("Operation failed");
    }
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await crudRequest("DELETE", `/testimonials/delete/${id}`);
      toast.success("Testimonial deleted successfully");
      fetchTestimonials();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      feedback: "",
      location: "",
      image: null,
    });
    setEditingId(null);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial._id);
    setFormData({
      name: testimonial.name,
      feedback: testimonial.feedback,
      location: testimonial.location,
      image: null,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage Testimonials</h1>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Feedback</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {testimonials &&
            testimonials.map((testimonial) => (
              <TableRow key={testimonial._id}>
                <TableCell>
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </TableCell>
                <TableCell>{testimonial.name}</TableCell>
                <TableCell>{testimonial.feedback}</TableCell>
                <TableCell>{testimonial.location}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(testimonial)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {adminDetails.role === "admin" && (
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(testimonial._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={formData.feedback}
                onChange={(e) =>
                  setFormData({ ...formData, feedback: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="image">Image</Label>
              <div className="mt-2">
                <Input
                  id="image"
                  type="file"
                  onChange={(e) =>
                    e.target.files &&
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                  accept="image/*"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              )}
              {editingId ? "Update" : "Submit"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestimonialsAdmin;
