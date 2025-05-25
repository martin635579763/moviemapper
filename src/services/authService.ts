
'use client';

const MANAGER_STORAGE_KEY = 'cinemaApp_isManager_v1';

export function getManagerStatusService(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const storedIsManager = localStorage.getItem(MANAGER_STORAGE_KEY);
    return storedIsManager === 'true';
  } catch (error) {
    console.error("AuthService: Error reading manager status from localStorage", error);
    return false;
  }
}

export function setManagerStatusService(isManager: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (isManager) {
      localStorage.setItem(MANAGER_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(MANAGER_STORAGE_KEY); // Also clear if explicitly set to false
    }
  } catch (error) {
    console.error("AuthService: Error saving manager status to localStorage", error);
  }
}

export function clearManagerStatusService(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MANAGER_STORAGE_KEY);
  } catch (error) {
    console.error("AuthService: Error removing manager status from localStorage", error);
  }
}
