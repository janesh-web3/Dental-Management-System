# SMS Analytics & Relationship Visibility System

This document describes the enhanced Bulk SMS Tracking & Relationship Visibility feature implemented in the dental management system.

## Overview

The enhanced SMS system provides comprehensive tracking and analytics capabilities to show the relationship between SMS templates, patient groups, and individual patients. This allows clinics to analyze engagement, follow-up visits, and communication effectiveness.

## Key Features

### 1. Template → Group Relationship Tracking

- For each SMS template, the system maintains a record of all patient groups it has been sent to
- Displays a "Groups Sent To" section in the SMS template detail view
- Each entry includes: group_name, total_patients, date_sent, and sent_by_user
- Clickable group names that open detailed patient lists
- Stores mapping data in the `sms_template_groups` collection

### 2. Template → Patient Relationship Tracking

- Shows which individual patients each SMS template has been sent to
- Displays in a "Patients Sent" tab inside the same template details page
- Each patient entry includes: patient_name, phone_number, last_visit_date, group_name (if applicable), and delivery_status
- Integrates data from sms_logs and patient_visits collections to correlate SMS activity with recent visits
- Provides search and filter options (by date range)
- Highlights patients who haven't visited after receiving SMS

### 3. Backend & Database Updates

- Enhanced `sms_template_groups` collection with fields: template_id, group_id, send_date
- Enhanced `sms_logs` with template_id, group_id, and visit_reference
- When sending bulk SMS, the system stores mapping between template → group → patients for every send event
- Joins `sms_logs` with `patient_visits` on patient_id to retrieve last doctor visit info for analytics view
- Efficient query to fetch all patients that received a given template with last_visit_date

### 4. Analytics & Reporting

- Dashboard widget showing which templates are most used and which groups received the most messages
- Shows percentage of patients who visited the clinic after receiving an SMS (conversion rate)
- Allows exporting data as CSV or Excel for reporting
- Includes charts: Bar Chart (Templates vs Groups Sent) and Pie Chart (Patient Visit After SMS)

## Implementation Details

### Backend Models

#### SMSTemplateGroup
```javascript
{
  templateId: ObjectId,    // Reference to SMSTemplate
  groupId: ObjectId,       // Reference to PatientGroup
  sendDate: Date,          // When the SMS was sent
  sentBy: ObjectId,        // User who sent the SMS
  patientCount: Number     // Number of patients in the group at time of sending
}
```

#### Enhanced SMSHistory
```javascript
{
  // ... existing fields ...
  templateId: ObjectId,    // Reference to SMSTemplate
  groupId: ObjectId,       // Reference to PatientGroup
  groupName: String,       // Group name for display
  visitReference: ObjectId // Reference to patient visit if linked
}
```

### API Endpoints

1. `GET /sms/template/:templateId/groups` - Get groups a template has been sent to
2. `GET /sms/template/:templateId/patients` - Get patients a template has been sent to
3. `GET /sms/template/:templateId/analytics` - Get analytics for a specific template
4. `GET /sms/analytics` - Get overall SMS analytics

### Frontend Components

1. `EnhancedSMSTemplateManager` - Updated template manager with "Groups Sent To" and "Patients Sent" tabs
2. `SMSAnalyticsDashboard` - New analytics dashboard with charts and metrics
3. `SMS` - Main SMS page with navigation to analytics

## Usage

### Viewing Template Relationships

1. Navigate to SMS → Templates
2. Click on any template to view its details
3. Switch to the "Groups Sent To" tab to see which groups received this template
4. Switch to the "Patients Sent" tab to see which patients received this template

### Analytics Dashboard

1. Navigate to SMS → Analytics
2. View overall SMS metrics and charts
3. Analyze template usage and group distribution
4. Track patient visit rates after SMS

## Benefits

- Improved tracking of SMS communication effectiveness
- Better understanding of patient engagement patterns
- Data-driven decisions for future SMS campaigns
- Enhanced patient care through follow-up analysis