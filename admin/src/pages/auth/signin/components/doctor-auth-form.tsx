import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useDoctorAuthContext } from "@/contexts/doctorAuthContext";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type DoctorFormValue = z.infer<typeof formSchema>;

export default function DoctorAuthForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useDoctorAuthContext();
  
  const defaultValues = {
    email: "",
    password: "",
  };
  
  const navigate = useNavigate();
  const form = useForm<DoctorFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: DoctorFormValue) => {
    setLoading(true);
    try {
      const success = await login(data.email, data.password);
      
      if (success) {
        toast.success("Doctor login successful!");
        navigate("/doctor/dashboard");
      } else {
        toast.error("Invalid credentials. Please check your email and password.");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      
      // Provide more specific error messages based on the error
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          toast.error("Invalid credentials. Please check your email and password.");
        } else if (status === 403) {
          toast.error("Your account is inactive. Please contact the administrator.");
        } else {
          toast.error(error.response.data?.message || "Login failed. Please try again.");
        }
      } else if (error.request) {
        toast.error("Cannot connect to server. Please check your internet connection.");
      } else {
        toast.error("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email address..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div style={{ position: "relative" }}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password..."
                      disabled={loading}
                      {...field}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 10, top: 6, cursor: "pointer" }}
                      className="text-foreground"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={loading} className="w-full ml-auto" type="submit">
            {loading ? "Logging in..." : "Login as Doctor"}
          </Button>
        </form>
      </Form>
    </>
  );
}
