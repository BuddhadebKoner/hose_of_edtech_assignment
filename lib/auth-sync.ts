"use client";

/**
 * Cross-tab authentication synchronization using BroadcastChannel API
 * Ensures logout in one tab immediately logs out all other tabs
 */

const CHANNEL_NAME = "auth_sync";
const LOGOUT_EVENT = "logout";
const LOGIN_EVENT = "login";

type AuthSyncMessage = {
   type: typeof LOGOUT_EVENT | typeof LOGIN_EVENT;
   timestamp: number;
};

let channel: BroadcastChannel | null = null;

/**
 * Initialize the auth sync channel
 */
export function initAuthSync(onLogout: () => void, onLogin?: () => void) {
   // Check if BroadcastChannel is supported
   if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      console.warn("BroadcastChannel not supported");
      return () => { };
   }

   // Create channel if it doesn't exist
   if (!channel) {
      channel = new BroadcastChannel(CHANNEL_NAME);
   }

   // Listen for messages
   const handleMessage = (event: MessageEvent<AuthSyncMessage>) => {
      if (event.data.type === LOGOUT_EVENT) {
         console.log("Logout event received from another tab");
         onLogout();
      } else if (event.data.type === LOGIN_EVENT && onLogin) {
         console.log("Login event received from another tab");
         onLogin();
      }
   };

   channel.addEventListener("message", handleMessage);

   // Return cleanup function
   return () => {
      if (channel) {
         channel.removeEventListener("message", handleMessage);
      }
   };
}

/**
 * Broadcast logout event to all tabs
 */
export function broadcastLogout() {
   if (channel) {
      const message: AuthSyncMessage = {
         type: LOGOUT_EVENT,
         timestamp: Date.now(),
      };
      channel.postMessage(message);
   }
}

/**
 * Broadcast login event to all tabs
 */
export function broadcastLogin() {
   if (channel) {
      const message: AuthSyncMessage = {
         type: LOGIN_EVENT,
         timestamp: Date.now(),
      };
      channel.postMessage(message);
   }
}

/**
 * Close the auth sync channel
 */
export function closeAuthSync() {
   if (channel) {
      channel.close();
      channel = null;
   }
}
