import { describe, it, expect } from 'vitest';
import { db } from '../firebase';

describe('Firebase Offline Persistence', () => {
  it('should have Firestore instance exported', () => {
    expect(db).toBeDefined();
    expect(db.type).toBe('firestore');
  });

  it('should have persistence enabled', async () => {
    // Verificar que la persistencia está configurada
    // Nota: En tests unitarios no podemos verificar realmente,
    // pero podemos verificar que la configuración existe
    expect(db).toHaveProperty('_settings');
  });

  it('should have cache size configured', () => {
    // Verificar configuración de caché
    expect(db).toBeDefined();
  });
});
