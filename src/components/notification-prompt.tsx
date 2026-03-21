"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    ),
  });

  await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  return subscription;
}

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Don't show if notifications aren't supported
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    // Don't show if already granted or denied
    if (Notification.permission === "granted") {
      // Already granted — make sure we're subscribed
      checkExistingSubscription();
      return;
    }
    if (Notification.permission === "denied") return;

    // Show prompt after a short delay
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  async function checkExistingSubscription() {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (!existing) {
      // Permission granted but no subscription — subscribe now
      await subscribeToPush();
    }
    setSubscribed(true);
  }

  async function handleAccept() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribeToPush();
        setSubscribed(true);
      }
    } catch {
      // User denied or error
    }
    setShow(false);
  }

  function handleDismiss() {
    setShow(false);
    // Remember dismissal so we don't ask again this session
    sessionStorage.setItem("notification-dismissed", "1");
  }

  if (!show || subscribed) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#E8384F]/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-[#E8384F]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A]">
            Activer les notifications ?
          </p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            On te rappellera le soir si tu n'as pas atteint tes macros.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAccept}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#E8384F] rounded-lg hover:bg-[#d42f44] transition-colors"
            >
              Activer
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 text-xs font-medium text-[#6B7280] bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-[#6B7280] hover:text-[#1A1A1A]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
