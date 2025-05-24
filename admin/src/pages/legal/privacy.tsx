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
    transition: { duration: 0.6 }
  }
};

const PrivacyPolicyPage = () => {
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
              <Button variant="ghost" size="sm" className="flex items-center text-primary">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 ml-auto mr-auto">
              Privacy Policy
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
                At Crown Dental Management System, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our dental management application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                2. Information We Collect
              </h2>
              <p className="leading-relaxed">
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Register for an account</li>
                <li>Fill in forms within the application</li>
                <li>Correspond with us</li>
                <li>Schedule appointments</li>
                <li>Submit patient information</li>
                <li>Process payments</li>
              </ul>
              <p className="leading-relaxed mt-3">
                The types of information we may collect include:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Personal identifiers (name, email address, phone number)</li>
                <li>Professional information (for doctors and administrators)</li>
                <li>Medical and dental information (for patients)</li>
                <li>Payment and insurance information</li>
                <li>Usage data and application interaction information</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                3. How We Use Your Information
              </h2>
              <p className="leading-relaxed">
                We use the information we collect for various purposes, including to:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and complete transactions</li>
                <li>Send administrative information, such as appointment reminders</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Analyze usage patterns and trends</li>
                <li>Protect against, identify, and prevent fraud and other illegal activity</li>
                <li>Comply with our legal obligations</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                4. Information Sharing and Disclosure
              </h2>
              <p className="leading-relaxed">
                We may share your information in the following situations:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>With Your Consent:</strong> We may share information with third parties when you consent to such sharing.</li>
                <li><strong>Service Providers:</strong> We may share information with third-party vendors and service providers that perform services on our behalf.</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid requests by public authorities.</li>
                <li><strong>Business Transfers:</strong> We may share information in connection with a merger, sale of company assets, financing, or acquisition of all or a portion of our business.</li>
                <li><strong>Healthcare Providers:</strong> We may share information with other healthcare providers involved in your care, with your consent.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                5. Data Security
              </h2>
              <p className="leading-relaxed">
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                6. Data Retention
              </h2>
              <p className="leading-relaxed">
                We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law. No purpose in this policy will require us keeping your personal information for longer than the period of time in which users have an account with us.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                7. Your Privacy Rights
              </h2>
              <p className="leading-relaxed">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The right to access personal information we hold about you</li>
                <li>The right to request correction of inaccurate personal information</li>
                <li>The right to request deletion of your personal information</li>
                <li>The right to object to processing of your personal information</li>
                <li>The right to data portability</li>
                <li>The right to withdraw consent</li>
              </ul>
              <p className="leading-relaxed mt-3">
                To exercise these rights, please contact us using the information provided in the "Contact Us" section.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                8. Children's Privacy
              </h2>
              <p className="leading-relaxed">
                Our service is not directed to children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary actions.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                9. Changes to This Privacy Policy
              </h2>
              <p className="leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                10. Contact Us
              </h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="font-medium">privacy@crowndental.com</p>
              <div className="mt-2">
                <ContactDialog 
                  triggerText="Contact Support" 
                  contextText="Have questions about our privacy policy? We'd love to hear from you!"
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
        contextText="Have questions about our privacy policy? We'd love to hear from you!"
        buttonVariant="default"
        buttonSize="lg"
        buttonClassName=""
        fixedPosition={true}
      />
    </div>
  );
};

export default PrivacyPolicyPage;
