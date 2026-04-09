import { getClientId, initDB, notifySync } from './index';
import { generateUUID } from '../../utils/uuid';

export async function runInitialSeed() {
  const clientId = await getClientId(); // Get ID before starting transaction to avoid inactive error
  const db = await initDB();
  const tx = db.transaction(['appSettings', 'categories'], 'readwrite');
  
  const settingsStore = tx.objectStore('appSettings');

  // Default app settings
  const hasSettings = (await settingsStore.getAllKeys()).length > 1; // more than just clientId
  if (!hasSettings) {
    await settingsStore.put('GBP', 'defaultCurrency');
    await settingsStore.put('light', 'theme');
    await settingsStore.put('DD/MM/YYYY', 'dateFormat');
    await settingsStore.put(1, 'firstDayOfWeek');
    await settingsStore.put(1, 'budgetStartDay');
    await settingsStore.put([], 'smartEntryHistory');
    notifySync('appSettings');
  }

  // System Categories
  const categoryStore = tx.objectStore('categories');
  const count = await categoryStore.count();
  
  if (count === 0) {
    const now = new Date().toISOString();
    const systemCategories = [
      { name: 'Groceries', icon: '🛒', color: '#16a34a', type: 'expense' as const },
      { name: 'Transport', icon: '🚍', color: '#0284c7', type: 'expense' as const },
      { name: 'Rent', icon: '🏠', color: '#8655f6', type: 'expense' as const },
      { name: 'Salary', icon: '💰', color: '#16a34a', type: 'income' as const },
      { name: 'Transfer In', icon: '📥', color: '#7a7581', type: 'transfer' as const },
      { name: 'Transfer Out', icon: '📤', color: '#7a7581', type: 'transfer' as const },
    ];

    for (const cat of systemCategories) {
      await categoryStore.put({
        id: generateUUID(),
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isSystem: true,
        parentId: null,
        syncMeta: {
          isDirty: true,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          clientId: clientId,
          version: 1,
        }
      });
    }
    notifySync('categories');
  }

  await tx.done;
}
