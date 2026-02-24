# Firebase Configuration for Billing Module

## Changes Required in Firebase Console

### 1. Firestore Indexes

Added indexes for billing collections:

#### Invoices Collection
```javascript
// Collection: invoices
// Index 1: franchiseId + status + issueDate
franchiseId ASC, status ASC, issueDate DESC

// Index 2: franchiseId + paymentStatus + dueDate
franchiseId ASC, paymentStatus ASC, dueDate ASC

// Index 3: franchiseId + issueDate
franchiseId ASC, issueDate DESC
```

#### Payment Receipts Collection
```javascript
// Collection: payment_receipts
invoiceId ASC, paymentDate DESC
```

#### Tax Vault Collection
```javascript
// Collection: tax_vault
franchiseId ASC, period DESC
```

#### Invoice History Collection
```javascript
// Collection: invoices_history
invoiceId ASC, changedAt DESC
```

### 2. Deploy Commands

```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy Cloud Functions
cd functions && npm run build && cd .. && firebase deploy --only functions
```

### 3. Firestore Rules

Added security rules for:
- `/invoices/{invoiceId}` - Read/write based on franchise ownership
- `/invoices_history/{historyId}` - Audit trail
- `/payment_receipts/{receiptId}` - Payment records
- `/tax_vault/{taxVaultId}` - Fiscal closing (admin only for write)

Key security features:
- Invoices are immutable after ISSUED status
- Only DRAFT invoices can be edited or deleted
- Tax vault operations restricted to admins
- All operations verify franchise ownership

### 4. Storage Rules

Added paths for:
- `/invoices/{franchiseId}/{year}/{month}/{invoiceId}.pdf` - Invoice PDFs
- `/payments/{franchiseId}/{paymentId}/{filename}` - Payment documents

### 5. Cloud Functions

Functions to deploy:
1. `generateInvoicePdf` - Triggered on DRAFT→ISSUED transition
2. `generateRectificationPdf` - Rectification PDF generation
3. `syncInvoiceToTaxVault` - Tax aggregation
4. `cleanupDraftInvoices` - Daily cleanup (2AM)
5. `sendPaymentReminders` - Daily reminders (9AM)

### 6. Environment Variables

Required in Firebase Functions:
```bash
firebase functions:config:set billing.logo_url="https://your-domain.com/logo.png"
firebase functions:config:set billing.company_name="REPAART"
firebase functions:config:set billing.company_cif="B12345678"
```

### 7. Initial Setup Checklist

- [ ] Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage:rules`
- [ ] Set environment variables: `firebase functions:config:set ...`
- [ ] Deploy Cloud Functions: `firebase deploy --only functions`
- [ ] Upload company logo to Storage
- [ ] Test invoice creation flow
- [ ] Test PDF generation
- [ ] Verify security rules

## Post-Deploy Verification

1. **Indexes**: Check Firebase Console → Firestore → Indexes
2. **Rules**: Check Firebase Console → Firestore → Rules
3. **Functions**: Check Firebase Console → Functions
4. **Storage**: Check Firebase Console → Storage → Rules

## Estimated Deployment Time

- Indexes: 2-5 minutes (auto-created on first query)
- Rules: Immediate
- Functions: 2-3 minutes
- Total: ~10 minutes
