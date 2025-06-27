# SMS System Documentation

This document outlines the SMS system implemented in the DMS (Dental Management System) application.

## Features

1. **Single SMS Sending**: Send SMS to individual patients or any phone number
2. **Bulk SMS Sending**: Send SMS to all patients or filtered groups
3. **SMS Templates**: Create and use reusable message templates
4. **SMS Scheduling**: Schedule SMS to be sent at a future date/time
5. **SMS History**: Track the history of all sent messages
6. **Patient-specific Variables**: Use variables like {{name}} in templates
7. **Credit Monitoring**: Automatic monitoring of SMS credit balance
8. **Monthly Reports**: Automated generation of monthly SMS usage reports
9. **Advanced Filtering**: Filter patients by various criteria for bulk SMS

## Setup

### Prerequisites

1. An Aakash SMS account (https://aakashsms.com)
2. Authentication token from your Aakash SMS account
3. Node.js and npm

### Configuration

1. Copy `.env.example` to `.env` and fill in your Aakash SMS credentials:
   ```
   AAKASH_SMS_AUTH_TOKEN=your_aakash_sms_auth_token
   AAKASH_SMS_CREDIT_ALERT_THRESHOLD=100
   SMS_SCHEDULER_API_KEY=your_secure_api_key
   API_URL=http://localhost:8080/api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the SMS scheduler:
   ```
   npm run sms-scheduler
   ```

## API Endpoints

### SMS Sending

- `POST /api/sms/single`: Send a single SMS
  ```json
  {
    "phoneNumber": "9812345678",
    "message": "Hello, this is a test message",
    "patientId": "optional_patient_id",
    "templateId": "optional_template_id",
    "variables": {"name": "John", "appointment": "Tomorrow"},
    "scheduledFor": "2023-06-28T10:00:00Z"
  }
  ```

- `POST /api/sms/bulk`: Send bulk SMS
  ```json
  {
    "message": "Hello all patients",
    "templateId": "optional_template_id",
    "variables": {"appointment": "Tomorrow"},
    "patientIds": ["id1", "id2"],
    "filters": {
      "group": "Ortho",
      "doctor": "doctor_id",
      "gender": "Male",
      "completionStatus": "completed",
      "procedure": "RCT",
      "registrationDateStart": "2023-01-01",
      "registrationDateEnd": "2023-12-31"
    },
    "scheduledFor": "2023-06-28T10:00:00Z"
  }
  ```

### Credit Management

- `GET /api/sms/credit`: Check available SMS credit
- `GET /api/sms/credit/detailed`: Get detailed credit information including usage

### Templates

- `GET /api/sms/templates`: Get all templates
- `POST /api/sms/templates`: Create a new template
  ```json
  {
    "name": "Appointment Reminder",
    "content": "Hello {{name}}, this is a reminder about your appointment on {{date}}",
    "variables": ["name", "date"],
    "category": "Appointment"
  }
  ```
- `PUT /api/sms/templates/:templateId`: Update a template
- `DELETE /api/sms/templates/:templateId`: Delete a template

### SMS History

- `GET /api/sms/history`: Get SMS history
  - Query params: `page`, `limit`, `patientId`, `status`
- `GET /api/sms/report`: Get SMS usage report
  - Query params: `startDate`, `endDate`

### Scheduled SMS

- `POST /api/sms/process-scheduled`: Process scheduled SMS messages (admin only)

## Frontend Usage

The SMS system is accessible through the admin panel under the "SMS Management" section. It provides interfaces for:

1. Sending single SMS to specific patients or phone numbers
2. Sending bulk SMS to groups of patients with advanced filtering options:
   - Filter by patient group (Ortho, Endo, etc.)
   - Filter by gender
   - Filter by treatment completion status
   - Filter by dental procedure
   - Filter by registration date range
3. Managing SMS templates
4. Viewing SMS history
5. Monitoring SMS credit balance

## Technical Implementation

- Uses Aakash SMS API for SMS delivery
  - v3 API for single SMS sending
  - v4 API for bulk SMS and multiple messages to multiple recipients
- Implements Nepal phone number format validation (10-digit numbers)
- Stores SMS history for audit and tracking
- Uses template variables for personalization
- Implements scheduling via node-cron
- Monitors credit balance with daily alerts
- Generates monthly usage reports

## SMS Scheduler Features

The SMS scheduler provides the following features:

1. **Scheduled SMS Processing**: Checks for and sends scheduled SMS every 5 minutes
2. **Credit Monitoring**: Checks available credit daily at 9:00 AM and alerts when low
3. **Monthly Reports**: Generates SMS usage reports on the 1st of each month

To start the scheduler:

```bash
npm run sms-scheduler
```

For production, consider setting up a proper process manager like PM2:

```bash
pm2 start smsScheduler.js --name "sms-scheduler"
```

## Utility Functions

The `aakashSmsUtils.js` file provides utility functions for:

- Formatting and validating Nepal phone numbers
- Sending single SMS messages (v3 API)
- Sending bulk SMS messages (v4 API)
- Checking credit balance
- Generating SMS reports
- Sending interactive SMS for campaigns
