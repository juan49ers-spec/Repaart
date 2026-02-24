# Firebase Cloud Functions - Billing Module

## Overview

This directory contains Firebase Cloud Functions for the Billing & Treasury module of Repaart v3.0. These functions handle server-side operations such as PDF generation, tax vault synchronization, and scheduled tasks.

## Functions

### 1. generateInvoicePdf

**Trigger**: Firestore `onUpdate` on `invoices/{invoiceId}`

**Description**: Automatically generates a PDF when an invoice transitions from DRAFT to ISSUED status. The PDF is stored in Firebase Storage and the URL is updated in the invoice document.

**Region**: europe-west1 (GDPR compliance)

**Features**:
- Professional invoice layout with company branding
- European invoice format compliance
- All data embedded at generation time (immutable)
- Stored in Firebase Storage with public URL
- Automatic retry on failure

**Storage Path**: `invoices/{franchiseId}/{period}/{invoiceNumber}.pdf`

### 2. generateRectificationPdf

**Trigger**: Firestore `onCreate` on `invoices/{invoiceId}`

**Description**: Generates a PDF for rectifying invoices with reference to the original invoice and the reason for rectification.

**Features**:
- References original invoice
- Includes rectification reason
- Visual indicators for negative amounts
- Same storage structure as standard invoices

### 3. syncInvoiceToTaxVault

**Trigger**: Firestore `onUpdate` on `invoices/{invoiceId}`

**Description**: Automatically syncs issued invoices to the Tax Vault, aggregating tax amounts by period.

**Features**:
- Automatically adds IVA to the corresponding period
- Creates new tax vault entry if needed
- Respects locked periods
- Transactional updates

### 4. cleanupDraftInvoices

**Trigger**: Pub/Sub schedule (daily at 2 AM)

**Description**: Deletes draft invoices older than 30 days to maintain data hygiene.

**Schedule**: `0 2 * * *` (2:00 AM daily)

**Timezone**: Europe/Madrid

### 5. sendPaymentReminders

**Trigger**: Pub/Sub schedule (daily at 9 AM)

**Description**: Sends payment reminders for invoices that are overdue by more than 30 days.

**Schedule**: `0 9 * * *` (9:00 AM daily)

**Timezone**: Europe/Madrid

**Features**:
- Groups overdue invoices by franchise
- Sends aggregated reminders
- Configurable reminder thresholds

## Deployment

### Prerequisites

1. Install Firebase Functions dependencies:
```bash
cd functions
npm install
```

2. Configure Firebase project:
```bash
firebase login
firebase use your-project-id
```

### Deploy Functions

Deploy all functions:
```bash
firebase deploy --only functions
```

Deploy specific function:
```bash
firebase deploy --only functions:generateInvoicePdf
```

Deploy with region:
```bash
firebase deploy --only functions:generateInvoicePdf --region europe-west1
```

### Configuration

Set environment variables if needed:
```bash
firebase functions:config:set billing.logo_url="https://your-domain.com/logo.png"
firebase functions:config:set billing.email_from="noreply@your-domain.com"
```

## Storage Structure

### PDF Storage

```
invoices/
├── {franchiseId}/
│   ├── {period}/
│   │   ├── {invoiceNumber}.pdf
│   │   └── {rectificationNumber}.pdf
```

### Metadata

Each PDF file includes metadata:
- `invoiceId`: Document ID
- `franchiseId`: Franchise identifier
- `invoiceNumber`: Full invoice number (e.g., "2026-A/0001")
- `type`: Invoice type (STANDARD or RECTIFICATIVE)
- `generatedAt`: ISO timestamp of generation

## Error Handling

All functions include error handling:

1. **PDF Generation**: If PDF generation fails, the invoice remains ISSUED but without PDF URL. Error is logged for manual intervention.

2. **Tax Vault Sync**: If tax vault is locked, sync is skipped with a warning.

3. **Scheduled Functions**: Errors are logged but don't stop the function execution.

## Monitoring

### View Logs

```bash
# View all logs
firebase functions:log

# View specific function logs
firebase functions:log --only generateInvoicePdf

# View real-time logs
firebase functions:log --only generateInvoicePdf --limit 10
```

### Metrics

Monitor:
- PDF generation success rate
- Average PDF generation time
- Tax vault sync frequency
- Scheduled function execution time

## Testing

### Local Testing

```bash
# Start Firebase emulators
firebase emulators:start

# Run functions locally
firebase functions:shell
```

### Test PDF Generation

```javascript
// Test invoice issuance
await db.collection('invoices').doc(invoiceId).update({
  status: 'ISSUED',
  issuedAt: admin.firestore.FieldValue.serverTimestamp()
});
```

### Test Tax Vault Sync

```javascript
// Test invoice sync
await db.collection('invoices').doc(invoiceId).update({
  status: 'ISSUED'
});
```

## Security

### Access Control

- PDFs are stored as public files (can be changed to signed URLs)
- Functions run with service account permissions
- Firestore rules still apply to client access

### Data Protection

- All data processed in europe-west1 region (GDPR)
- PDFs are immutable once generated
- Tax vault is locked after monthly close

## Cost Considerations

### PDF Generation
- **Invocations**: Per invoice issued
- **Compute Time**: ~1-2 seconds per PDF
- **Storage**: ~50-100 KB per PDF

### Scheduled Functions
- **Frequency**: Daily (2 functions)
- **Execution Time**: Depends on data volume
- **Free Tier**: Usually sufficient for SME operations

### Estimated Costs

For a SME with 100 invoices/month:
- **PDF Generation**: ~$0.10/month
- **Storage**: ~$0.01/month
- **Tax Vault Sync**: Included in free tier
- **Scheduled Tasks**: Included in free tier

## Future Enhancements

1. **Email Notifications**: Send PDFs by email on issuance
2. **Multi-language**: Generate PDFs in multiple languages
3. **Custom Templates**: Franchise-specific PDF templates
4. **Batch Generation**: Generate multiple PDFs in batch
5. **Archival**: Archive old PDFs to cold storage
6. **Digital Signatures**: Add digital signatures to PDFs

## Troubleshooting

### PDF Not Generated

1. Check function logs: `firebase functions:log --only generateInvoicePdf`
2. Verify invoice status changed from DRAFT to ISSUED
3. Check Storage bucket permissions
4. Verify invoice data has all required fields

### Tax Vault Not Updated

1. Check if month is locked
2. Verify invoice status is ISSUED
3. Check function logs for errors
4. Manually trigger sync if needed

### High Costs

1. Monitor function invocations
2. Optimize PDF generation (reduce image quality)
3. Use scheduled functions more efficiently
4. Consider batch operations for bulk processing
