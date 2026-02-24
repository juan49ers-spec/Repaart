import { describe, it, expect } from 'vitest';
import indexes from '../../../firestore.indexes.json';

describe('Firestore Indexes', () => {
  it('should have indexes defined', () => {
    expect(indexes.indexes).toBeDefined();
    expect(indexes.indexes.length).toBeGreaterThan(0);
  });

  it('should have index for users collection by franchiseId and role', () => {
    const userIndex = indexes.indexes.find(
      idx => idx.collectionGroup === 'users' &&
        idx.fields.some(f => f.fieldPath === 'franchiseId') &&
        idx.fields.some(f => f.fieldPath === 'role')
    );
    expect(userIndex).toBeDefined();
  });

  it('should have index for fleet_assets by franchiseId', () => {
    const assetIndex = indexes.indexes.find(
      idx => idx.collectionGroup === 'fleet_assets' &&
        idx.fields.some(f => f.fieldPath === 'franchiseId')
    );
    expect(assetIndex).toBeDefined();
  });

});
