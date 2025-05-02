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
import { crudRequest } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface AuthResponse {
  username: string;
  token: string;
}

const formSchema = z.object({
  contact: z.string({ message: "Enter phone number" }),
  password: z.string({ message: "Incorrect Password" }),
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const [loading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const defaultValues = {
    contact: "",
    password: "",
  };
  const navigate = useNavigate();
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: UserFormValue) => {
    try {
      const response: AuthResponse = await crudRequest(
        "POST",
        "/user/login-user",
        data
      );
      console.log(response);
      if(response.token){
        toast.success("Login successful !");
        sessionStorage.setItem("token", response.token);
        navigate("/");
        window.location.reload();
      }
      else{
        toast.error("Login Failed !");
      }
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login Failed !");
    }

    console.log("data", data);
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
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Enter your phone number..."
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
            Continue
          </Button>
        </form>
      </Form>
    </>
  );
}
