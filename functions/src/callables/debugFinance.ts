import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Debug function to check financial documents and permissions
 * ONLY FOR ADMIN USE
 */
export const debugFinancePermissions = onCall(async (request) => {
  // 1. Auth check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  // 2. Admin only
  const role = request.auth.token.role;
  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admin can use this debug function');
  }

  const { franchiseId, month } = request.data;
  const db = getFirestore();
  const result: any = {
    franchiseId,
    month,
    documents: []
  };

  try {
    // Check financial_summaries
    if (month) {
      const summaryId = `${franchiseId}_${month}`;
      const summaryRef = db.collection('financial_summaries').doc(summaryId);
      const summarySnap = await summaryRef.get();

      if (summarySnap.exists) {
        const summaryData = summarySnap.data();
        result.summary = {
          id: summarySnap.id,
          franchiseId: summaryData?.franchiseId,
          franchise_id: summaryData?.franchise_id,
          month: summaryData?.month,
          status: summaryData?.status
        };
      } else {
        result.summary = { exists: false };
      }
    }

    // Check all financial_summaries for this franchise
    const summariesQuery = db.collection('financial_summaries')
      .where('franchiseId', '==', franchiseId)
      .limit(5);

    const summariesSnap = await summariesQuery.get();
    result.summaries = summariesSnap.docs.map(doc => ({
      id: doc.id,
      franchiseId: doc.data().franchiseId,
      franchise_id: doc.data().franchise_id,
      month: doc.data().month
    }));

    // Check financial_records for this month
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0);

      const recordsQuery = db.collection('financial_records')
        .where('franchiseId', '==', franchiseId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .limit(5);

      const recordsSnap = await recordsQuery.get();
      result.records = recordsSnap.docs.map(doc => ({
        id: doc.id,
        franchiseId: doc.data().franchiseId,
        franchise_id: doc.data().franchise_id,
        date: doc.data().date,
        amount: doc.data().amount
      }));
    }

    return { success: true, data: result };
  } catch (error) {
    throw new HttpsError('internal', `Error: ${error}`);
  }
});
