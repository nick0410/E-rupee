export type PaymentAlert = {
  id: string;
  message: string;
  amount: number;
  txHash?: string;
  createdAt: string;
};

const STORAGE_KEY = "erupee_payment_alerts";
const EVENT_NAME = "erupee:payment-alert";
const MAX_ALERTS = 20;

export function getPaymentAlerts(): PaymentAlert[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PaymentAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePaymentAlerts(alerts: PaymentAlert[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, MAX_ALERTS)));
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";

  return Notification.requestPermission();
}

function playPaymentTune() {
  if (typeof window === "undefined") return;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const notes = [880, 1175];

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    const start = audioContext.currentTime + index * 0.15;
    const end = start + 0.12;

    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(end);
  });

  setTimeout(() => {
    audioContext.close();
  }, 700);
}

export function notifyPaymentReceived(amount: number, txHash?: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const roundedAmount = Number(amount);
  const alert: PaymentAlert = {
    id: `${Date.now()}`,
    message: `Payment received: ₹${roundedAmount.toLocaleString("en-IN")}`,
    amount: roundedAmount,
    txHash,
    createdAt: new Date().toISOString(),
  };

  const current = getPaymentAlerts();
  savePaymentAlerts([alert, ...current]);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));

  new Notification("eRupee Payment Received", {
    body: alert.message,
    tag: `payment-${alert.id}`,
  });

  playPaymentTune();
}

export function subscribePaymentAlerts(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  const onCustom = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT_NAME, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT_NAME, onCustom);
  };
}

export function clearPaymentAlerts() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}