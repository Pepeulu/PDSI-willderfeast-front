"use client";

import { useState, useSyncExternalStore } from "react";

const preferenceKey = "wilderfeast_sidebar_collapsed";
const preferenceChanged = "wilderfeast:sidebar";

function readPreference() {
  return localStorage.getItem(preferenceKey) === "true";
}

function subscribe(update: () => void) {
  window.addEventListener(preferenceChanged, update);
  return () => window.removeEventListener(preferenceChanged, update);
}

function serverPreference() {
  return false;
}

export function useSidebar() {
  const collapsed = useSyncExternalStore(
    subscribe,
    readPreference,
    serverPreference,
  );
  const [animate, setAnimate] = useState(false);

  function toggleSidebar() {
    localStorage.setItem(preferenceKey, String(!readPreference()));
    setAnimate(true);
    window.dispatchEvent(new Event(preferenceChanged));
  }

  const sidebarClasses = `${collapsed ? " sidebar-collapsed" : ""}${animate ? " sidebar-motion" : ""}`;
  return { collapsed, sidebarClasses, toggleSidebar };
}
