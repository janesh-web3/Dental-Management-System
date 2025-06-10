import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Icons
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  ClipboardList,
  Users,
  Settings,
  FileText,
  CreditCard,
} from "lucide-react";
import ContactDialog from "@/components/shared/contact-dialog";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="container px-4 mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              Welcome to <span className="text-primary">Crown Dental</span>{" "}
              Management System
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              A comprehensive solution for managing your dental practice with
              ease. Streamline appointments, patient records, billing, and more.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Link to="/login">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-medium"
                >
                  Login to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeIn}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-6 w-6 text-primary mr-2" />
                    Easy Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Manage appointments efficiently with our intuitive calendar
                    interface. Reduce no-shows with automated reminders.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardList className="h-6 w-6 text-primary mr-2" />
                    Patient Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Securely store and access patient information, treatment
                    history, and dental charts.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-6 w-6 text-primary mr-2" />
                    Billing & Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Streamline your financial operations with integrated billing
                    and payment processing.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container px-4 mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How to Use the System
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our dental management system is designed for different user roles.
              Here's how each role can make the most of it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Admin Guide */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full border-t-4 border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Settings className="h-6 w-6 text-blue-500 mr-2" />
                    For Administrators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Manage staff accounts and permissions</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Monitor practice performance with analytics</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Configure system settings and preferences</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Manage patient records and billing information</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Generate reports on practice operations</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Doctor Guide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full border-t-4 border-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Users className="h-6 w-6 text-green-500 mr-2" />
                    For Doctors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>View and manage your appointment schedule</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Access patient dental records and history</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Create treatment plans and prescriptions</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Track patient progress and outcomes</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Communicate with patients securely</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Patient Guide */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="h-full border-t-4 border-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <FileText className="h-6 w-6 text-purple-500 mr-2" />
                    For Patients
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Book and manage your appointments online</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>View your treatment history and upcoming plans</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Access and pay bills securely</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Communicate with your dental care team</p>
                  </div>
                  <div className="flex">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p>Receive appointment reminders and notifications</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Fixed position "Have Questions?" button */}
      <ContactDialog
        triggerText="Have Questions?"
        contextText="Have questions about our terms of service? We'd love to hear from you!"
        buttonVariant="default"
        buttonSize="lg"
        buttonClassName=""
        fixedPosition={true}
      />

      {/* Footer */}
      <footer className="py-8 bg-gray-100 dark:bg-gray-900">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} Crown Dental Management System.
                All rights reserved.
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-400 hover:text-primary"
              >
                Login
              </Link>
              <Link
                to="/privacy"
                className="text-gray-600 dark:text-gray-400 hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-gray-600 dark:text-gray-400 hover:text-primary"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
