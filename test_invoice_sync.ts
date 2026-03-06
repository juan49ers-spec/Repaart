import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function runTest() {
    try {
        console.log("=== INVOICE SYNC INTEGRATION TEST ===");
        const franchiseId = 'test_franchise_' + Date.now();
        const period = '2026-03';

        // 1. Create a fake invoice that is ISSUED
        const invoiceRef = db.collection('invoices').doc();
        const taxVaultId = `${franchiseId}_${period}`;
        const summaryId = `${franchiseId}_${period}`;

        console.log(`Setting up test data for franchise: ${franchiseId}, period: ${period}`);

        // Make sure tax_vault exists
        await db.collection('tax_vault').doc(taxVaultId).set({
            ivaRepercutido: 100, // Pre-existing tax
            invoiceIds: ['some_other_invoice']
        });

        // Make sure financial_summary exists
        await db.collection('financial_summaries').doc(summaryId).set({
            revenue: 500, // Pre-existing revenue
            totalIncome: 500,
            grossIncome: 500
        });

        // Add the target invoice
        const targetInvoiceData = {
            franchiseId,
            status: 'ISSUED',
            issueDate: new Date(),
            subtotal: 200, // This should be subtracted from revenue
            taxBreakdown: [
                { taxAmount: 42 } // This should be subtracted from tax_vault
            ],
            fullNumber: 'TEST-2026-0001'
        };
        await invoiceRef.set(targetInvoiceData);

        // Add a mock payment receipt
        const paymentRef = db.collection('payment_receipts').doc();
        await paymentRef.set({ invoiceId: invoiceRef.id, amount: 50 });

        console.log(`Created invoice ${invoiceRef.id} with subtotal 200, tax 42`);
        console.log("Initial state:");
        console.log(" - Tax Vault ivaRepercutido: 100");
        console.log(" - Financial Summary revenue: 500");

        // 2. We don't trigger functions via the SDK script, we wait for the trigger fire
        console.log("Deleting invoice to trigger onInvoiceDeleted...");
        await invoiceRef.delete();

        console.log("Waiting 3 seconds for Cloud Function to process...");
        await new Promise(r => setTimeout(r, 3000));

        // 3. Verify the changes
        const updatedTaxVault = await db.collection('tax_vault').doc(taxVaultId).get();
        const updatedSummary = await db.collection('financial_summaries').doc(summaryId).get();
        const paymentsQuery = await db.collection('payment_receipts').where('invoiceId', '==', invoiceRef.id).get();

        console.log("\n--- VERIFICATION RESULTS ---");

        const tvData = updatedTaxVault.data();
        if (tvData?.ivaRepercutido === 100 - 42) {
            console.log("✅ Tax Vault: ivaRepercutido decreased by 42 (Expected: 58, Actual: " + tvData.ivaRepercutido + ")");
        } else {
            console.log("❌ Tax Vault: Expected ivaRepercutido to be 58, got " + tvData?.ivaRepercutido);
        }

        const sumData = updatedSummary.data();
        if (sumData?.revenue === 500 - 200) {
            console.log("✅ Financial Summary: revenue decreased by 200 (Expected: 300, Actual: " + sumData.revenue + ")");
            console.log("✅ Financial Summary: totalIncome decreased to " + sumData.totalIncome);
        } else {
            console.log("❌ Financial Summary: Expected revenue to be 300, got " + sumData?.revenue);
        }

        if (paymentsQuery.empty) {
            console.log("✅ Related Payment Receipts: Successfully deleted");
        } else {
            console.log("❌ Related Payment Receipts: Still exist!");
        }

        // Verify audit log
        const auditQuery = await db.collection('audit_logs')
            .where('action', '==', 'INVOICE_DELETE')
            // Add a constraint to find it faster, desc order
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        const foundAudit = auditQuery.docs.find(d => d.data().details?.invoiceId === invoiceRef.id);
        if (foundAudit) {
            console.log("✅ Audit Log: Successfully recorded INVOICE_DELETE action");
        } else {
            console.log("❌ Audit Log: Record not found within latest logs");
        }

    } catch (e) {
        console.error("Test failed with error:", e);
    } finally {
        console.log("Test finished.");
        process.exit(0);
    }
}

runTest();
