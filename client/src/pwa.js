import { useEffect, useState } from 'react';
import { api } from './api.js';

// Chrome and Edge offer their own install prompt: it is kept for the "Install" button
let installPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  notify();
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  notify();
});

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// iPadOS presents itself as a Mac, so touch support tells them apart
export const isIos = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// Re-renders when the browser's install prompt becomes available
export function useInstallPrompt() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const listener = () => setVersion((v) => v + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    notify();
  };
  return { canInstall: Boolean(installPrompt), install };
}

// "BASE64URL" public key -> bytes, as the Push API expects
function keyToBytes(key) {
  const base64 = (key + '='.repeat((4 - (key.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

export async function currentSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

// Asks permission, subscribes this browser and saves it on the account; returns false if refused
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  const { publicKey } = await api('/push/key');
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ||
    (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
  await api('/push/subscribe', { method: 'POST', body: subscription.toJSON() });
  return true;
}

export async function disablePush() {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await api('/push/subscribe', { method: 'DELETE', body: { endpoint: subscription.endpoint } });
  await subscription.unsubscribe();
}
