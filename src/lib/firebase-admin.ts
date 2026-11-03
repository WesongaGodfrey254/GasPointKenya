import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  try {
    // @ts-ignore
    const local = await import('../../firebase-applet-config.json');
    projectId = local.default?.projectId || local.projectId;
  } catch {
    projectId = 'gaspoint-kenya';
  }
}

if (!getApps().length) {
  initializeApp({
    projectId: projectId || 'gaspoint-kenya',
  });
}

export const adminAuth = getAuth();
