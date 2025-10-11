# Bulk SMS Management System (Integrated with Aakash SMS - Nepal)

## Overview

This is a comprehensive Bulk SMS Management System integrated with Aakash SMS API, specifically optimized for dental clinics in Nepal. The system enables efficient communication with patients through personalized and automated messages.

## Features

### 1. SMS Template Management
- Create, edit, duplicate, preview, and delete SMS templates
- Template fields: name, message body, sender ID, and placeholders
- Template categorization (Appointment Reminder, Promotion, Follow-up, etc.)
- Auto-triggered templates for automated events
- Template usage tracking (last used date, total messages sent)

### 2. Patient Group & Filtering Mechanism
- Create patient groups using dynamic filters
- Filters include: doctor, follow-up date, treatment type, registration date, gender, visit status
- Manual and bulk patient selection
- Search, sort, and pagination for large patient lists
- Group management (edit, merge, delete)

### 3. Send SMS from Templates
- Select templates and patient groups/individuals
- Real-time SMS sending status display
- Aakash SMS API integration for reliable message delivery
- SMS scheduling for future delivery
- Character counter and cost estimation
- Test send functionality

### 4. SMS Delivery & Tracking Dashboard
- Full SMS log history with filtering
- Delivery status tracking (Delivered, Pending, Failed, etc.)
- Invalid number detection (Nepal-specific validation)
- Resend option for failed messages
- Analytics and reporting
- Excel/CSV export capability

## Technical Implementation

### Backend (Node.js/Express)

#### Models
- `SMSTemplate`: SMS template management
- `PatientGroup`: Patient grouping with dynamic filters
- `SMSHistory`: SMS sending history and status tracking
- `SMSDeliveryReport`: Delivery reports from Aakash SMS
- `SMSCampaign`: SMS campaign management
- `SMSClassConfig`: Class-based SMS configurations

#### Controllers
- `smsController`: Core SMS functionality
- `smsDeliveryController`: Delivery report handling
- `smsDashboardController`: Analytics and dashboard data
- `smsScheduleController`: SMS scheduling
- `patientGroupController`: Patient group management

#### Middleware
- `smsSecurityMiddleware`: Authorization, validation, and logging
- `adminAuthMiddleware`: Admin authentication
- `patientGroupController`: Patient group management

#### Utilities
- `aakashSmsUtils`: Aakash SMS API integration
- `smsScheduler`: Scheduled SMS processing

### Frontend (React/TypeScript)

#### Components
- `EnhancedSMSTemplateManager`: Template management UI
- `PatientGroupManager`: Patient group management UI
- `EnhancedBulkSMS`: Bulk SMS sending interface
- `SMSDashboard`: Analytics and tracking dashboard
- `NepalPhoneNumberValidator`: Nepal-specific phone number validation

#### Services
- `api.ts`: API service layer for all SMS-related endpoints

## Aakash SMS Integration

### API Endpoints
- **Single SMS**: Send individual messages
- **Bulk SMS**: Send messages to multiple recipients
- **Delivery Reports**: Webhook callback for status updates
- **Credit Check**: Balance and detailed credit information
- **Reports**: SMS usage and delivery reports

### Nepal-Specific Features
- Phone number validation (98/97/96 prefixes)
- Automatic formatting of Nepal phone numbers
- Country code handling (+977/977)

## Security Measures

### Authentication
- Only authorized staff or admin can send bulk messages
- Role-based access control (admin, doctor, staff)

### Validation
- Nepal-specific phone number validation
- Duplicate send prevention within time windows
- Input sanitization and validation

### Logging
- All SMS sending actions are logged with:
  - Timestamp
  - User information
  - IP address
  - User agent
  - Recipient details

## Automation Features

### Auto-Triggered Templates
- Appointment booking confirmation
- Appointment cancellation notification
- Missed visit reminders
- Payment due notifications
- Birthday wishes
- Feedback requests
- Follow-up reminders

### Scheduled SMS
- One-time scheduled messages
- Recurring scheduled messages
- Campaign scheduling

## API Endpoints

### SMS Templates
- `GET /api/sms/templates` - Get all templates
- `POST /api/sms/templates` - Create template
- `PUT /api/sms/templates/:id` - Update template
- `DELETE /api/sms/templates/:id` - Delete template

### Patient Groups
- `GET /api/patient-groups` - Get all groups
- `POST /api/patient-groups` - Create group
- `PUT /api/patient-groups/:id` - Update group
- `DELETE /api/patient-groups/:id` - Delete group
- `POST /api/patient-groups/filter-patients` - Filter patients for groups

### SMS Sending
- `POST /api/sms/single` - Send single SMS
- `POST /api/sms/bulk` - Send bulk SMS
- `POST /api/sms/group/:id` - Send SMS to group

### SMS History & Tracking
- `GET /api/sms/history` - Get SMS history
- `GET /api/sms-delivery/reports` - Get delivery reports
- `POST /api/sms-delivery/retry/:id` - Retry failed SMS

### Dashboard & Analytics
- `GET /api/sms-dashboard/stats` - Get dashboard statistics
- `GET /api/sms-dashboard/history` - Get detailed history
- `GET /api/sms-dashboard/analytics/templates` - Get template analytics
- `GET /api/sms-dashboard/analytics/costs` - Get cost analytics

### Scheduling
- `POST /api/sms-schedule` - Schedule SMS
- `GET /api/sms-schedule` - Get scheduled SMS
- `DELETE /api/sms-schedule/:id` - Cancel scheduled SMS

## Installation & Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - `AAKASH_SMS_API_KEY` - Aakash SMS API key
   - `AAKASH_SMS_SENDER_ID` - Sender ID for SMS
   - `DB_URL` - MongoDB connection string
   - Other required environment variables

4. Start the server:
   ```bash
   npm start
   ```

## Usage

1. Access the admin panel
2. Configure SMS settings and templates
3. Create patient groups using filters
4. Send bulk SMS using templates and groups
5. Monitor delivery status and analytics in the dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or open an issue in the repository.