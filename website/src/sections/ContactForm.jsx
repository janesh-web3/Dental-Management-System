import React, { useState } from "react";
import axios from "axios";
import { server } from "../server";
import { toast } from "react-toastify";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    instituteName: "",
    plan: "Basic",
    email: "",
    contactNumber: "",
    message: "",
    location: "",
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const request = await axios.post(`${server}/demo-request`, formData);
      if (request.status === 201) {
        toast.success("Request send successfully");
        setSending(false);
        setFormData({
          instituteName: "",
          plan: "Basic",
          email: "",
          contactNumber: "",
          message: "",
          location: "",
        });
      } else {
        toast.error("Failed to send request");
        setSending(false);
      }
    } catch (error) {
      toast.error("Failed to send request");
      console.log(error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-s1 rounded-14">
      <div className="w-full max-w-3xl p-8 rounded-lg shadow-md bg-s2">
        <h2 className="mb-6 text-2xl font-bold text-p5">
          Request a Demo for Dental Management System
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Institute Name */}
          <div>
            <label
              htmlFor="instituteName"
              className="block text-sm font-medium text-p5"
            >
              Clinic Name
            </label>
            <input
              type="text"
              id="instituteName"
              name="instituteName"
              value={formData.instituteName}
              onChange={handleChange}
              required
              className="block w-full p-3 mt-1 placeholder-gray-400 border-none rounded-md shadow-sm bg-s3 sm:text-sm focus:ring-0 focus:outline-none hover:ring-0 hover:outline-none"
              placeholder="Enter your clinic name"
            />
          </div>

          {/* Plan Selection */}
          <div>
            <label htmlFor="plan" className="block text-sm font-medium text-p5">
              Select a Plan
            </label>
            <select
              id="plan"
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              required
              className="block w-full p-3 mt-1 placeholder-gray-400 border-none rounded-md shadow-sm bg-s3 sm:text-sm focus:ring-0 focus:outline-none hover:ring-0 hover:outline-none"
            >
              <option value="Basic">Basic</option>
              <option value="Standard">Standard</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-p5"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="block w-full p-3 mt-1 placeholder-gray-400 border-none rounded-md shadow-sm bg-s3 sm:text-sm focus:ring-0 focus:outline-none hover:ring-0 hover:outline-none"
              placeholder="Enter your email"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label
              htmlFor="contactNumber"
              className="block text-sm font-medium text-p5"
            >
              Contact Number
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required
              className="block w-full p-3 mt-1 placeholder-gray-400 border-none rounded-md shadow-sm bg-s3 sm:text-sm focus:ring-0 focus:outline-none hover:ring-0 hover:outline-none"
              placeholder="Enter your contact number"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-p5"
            >
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="block w-full p-3 mt-1 placeholder-gray-400 border-none rounded-md shadow-sm bg-s3 sm:text-sm focus:ring-0 focus:outline-none hover:ring-0 hover:outline-none"
              placeholder="Enter your location"
            />
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-p5"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              className="block w-full p-3 mt-1 placeholder-gray-400 border-none rounded-md shadow-sm bg-s3 sm:text-sm focus:ring-0 focus:outline-none hover:ring-0 hover:outline-none"
              placeholder="Leave a message (optional)"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-0"
            >
              {sending ? "Sending..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
