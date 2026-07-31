import { getApps, initializeApp } from 'firebase-admin/app';

export function garantirFirebaseApp() {
  if (getApps().length === 0) {
    initializeApp();
  }
}
