import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactDialog from "@/components/shared/contact-dialog";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden"
        >
          {/* Header with back button */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6 flex items-center">
            <Link to="/home">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center text-primary"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-auto mr-auto">
              Terms of Service
            </h1>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6 text-gray-700 dark:text-gray-300">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                1. Introduction
              </h2>
              <p className="leading-relaxed">
                Welcome to Crown Dental Management System. These Terms of
                Service govern your use of our web application and services
                offered by Crown Dental. By accessing or using our service, you
                agree to be bound by these Terms. If you disagree with any part
                of the terms, you may not access the service.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                2. User Accounts
              </h2>
              <p className="leading-relaxed">
                When you create an account with us, you must provide accurate,
                complete, and current information. Failure to do so constitutes
                a breach of the Terms, which may result in immediate termination
                of your account on our service.
              </p>
              <p className="leading-relaxed">
                You are responsible for safeguarding the password that you use
                to access the service and for any activities or actions under
                your password. You agree not to disclose your password to any
                third party. You must notify us immediately upon becoming aware
                of any breach of security or unauthorized use of your account.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                3. User Obligations
              </h2>
              <p className="leading-relaxed">
                As a user of the Crown Dental Management System, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Provide accurate and complete information when using the
                  system
                </li>
                <li>Maintain the security of your account credentials</li>
                <li>
                  Use the system in compliance with all applicable laws and
                  regulations
                </li>
                <li>
                  Respect the privacy and confidentiality of patient information
                </li>
                <li>
                  Not use the system for any unauthorized or illegal purposes
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                4. Prohibited Activities
              </h2>
              <p className="leading-relaxed">
                You may not engage in any of the following prohibited
                activities:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Copying, distributing, or disclosing any part of the service
                  in any medium
                </li>
                <li>
                  Using any automated system to access the service without our
                  prior written consent
                </li>
                <li>
                  Attempting to interfere with, compromise the system integrity,
                  or decipher any transmissions to or from the servers running
                  the service
                </li>
                <li>
                  Uploading invalid data, viruses, worms, or other software
                  agents through the service
                </li>
                <li>
                  Collecting or harvesting any personally identifiable
                  information from the service
                </li>
                <li>
                  Impersonating another person or otherwise misrepresenting your
                  affiliation with a person or entity
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                5. Intellectual Property
              </h2>
              <p className="leading-relaxed">
                The service and its original content, features, and
                functionality are and will remain the exclusive property of
                Crown Dental and its licensors. The service is protected by
                copyright, trademark, and other laws of both the United States
                and foreign countries. Our trademarks and trade dress may not be
                used in connection with any product or service without the prior
                written consent of Crown Dental.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                6. Termination
              </h2>
              <p className="leading-relaxed">
                We may terminate or suspend your account immediately, without
                prior notice or liability, for any reason whatsoever, including
                without limitation if you breach the Terms. Upon termination,
                your right to use the service will immediately cease. If you
                wish to terminate your account, you may simply discontinue using
                the service.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                7. Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                In no event shall Crown Dental, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential or punitive
                damages, including without limitation, loss of profits, data,
                use, goodwill, or other intangible losses, resulting from your
                access to or use of or inability to access or use the service.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                8. Changes to Terms
              </h2>
              <p className="leading-relaxed">
                We reserve the right, at our sole discretion, to modify or
                replace these Terms at any time. If a revision is material we
                will try to provide at least 30 days' notice prior to any new
                terms taking effect. What constitutes a material change will be
                determined at our sole discretion.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                9. Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <p className="font-medium">support@crowndental.com</p>
              <div className="mt-2">
                <ContactDialog
                  triggerText="Contact Support"
                  contextText="Have questions about our terms of service? We'd love to hear from you!"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: May 24, 2025
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fixed position "Have Questions?" button */}
      <ContactDialog
        triggerText="Have Questions?"
        contextText="Have questions about our terms of service? We'd love to hear from you!"
        buttonVariant="default"
        buttonSize="lg"
        buttonClassName=""
        fixedPosition={true}
      />
    </div>
  );
};

export default TermsOfServicePage;
