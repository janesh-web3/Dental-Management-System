import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

// Import auth form components
import { PatientAuthForm } from "./components/patient-auth-form";
import DoctorAuthForm from "./components/doctor-auth-form";
import UserAuthForm from "./components/user-auth-form";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContactDialog from "@/components/shared/contact-dialog";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const backgroundVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.5 },
  },
};

// Floating shapes component
const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-20 ${i % 2 === 0 ? "bg-primary" : "bg-secondary"}`}
          style={{
            width: `${Math.random() * 200 + 50}px`,
            height: `${Math.random() * 200 + 50}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 40 - 20],
            y: [0, Math.random() * 40 - 20],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default function ModernSignInPage() {
  const [activeTab, setActiveTab] = useState<string>("admin");

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 z-0"
        variants={backgroundVariants}
        initial="hidden"
        animate="visible"
      >
        <FloatingShapes />
      </motion.div>

      {/* Back to home button */}
      <Link
        to="/home"
        className="absolute top-4 left-4 md:top-8 md:left-8 z-10 flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Home
      </Link>

      {/* Main content */}
      <motion.div
        className="w-full max-w-md z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div>
          <Card className="border-none shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <motion.div
                className="mx-auto mb-4 flex justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.2,
                }}
              >
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <img
                    src="/TLogoNew.png"
                    alt="Crown Dental"
                    className="h-16 w-16 object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </motion.div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription>
                Sign in to access your dental management system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs
                defaultValue="admin"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                  <TabsTrigger value="doctor">Doctor</TabsTrigger>
                  <TabsTrigger value="patient">Patient</TabsTrigger>
                </TabsList>

                {/* Admin Login Form */}
                <TabsContent value="admin" className="mt-0">
                  <UserAuthForm />
                </TabsContent>

                {/* Doctor Login Form */}
                <TabsContent value="doctor" className="mt-0">
                  <DoctorAuthForm />
                </TabsContent>

                {/* Patient Login Form */}
                <TabsContent value="patient" className="mt-0">
                  <PatientAuthForm />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-lg">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                By signing in, you agree to our{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Need help?{" "}
                  <div className="mt-2">
                    <ContactDialog
                      triggerText="Contact Support"
                      contextText="Have questions about our terms of service? We'd love to hear from you!"
                    />
                  </div>
                </p>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
