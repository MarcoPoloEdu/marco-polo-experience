/**
 * Booking + quote persistence (Firestore). Local JSON only with explicit opt-in.
 */

import "server-only";

import { randomUUID } from "crypto";
import type { ExactQuote } from "@/lib/quotes/types";
import { allowLocalPersistence, firestoreConfigured } from "@/lib/persistence";

export type PaymentStatus =
  | "unpaid"
  | "checkout_pending"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "needs_reconciliation";

export type BookingRecord = {
  bookingId: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: PaymentStatus;
  quoteId: string;
  quoteSnapshot: ExactQuote;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  idempotencyKey: string;
  /** Opaque access token for student portal (not guessable from bookingId) */
  accessToken: string;
  emailsSent?: boolean;
};

const memoryBookings = new Map<string, BookingRecord>();
const memoryQuotes = new Map<string, ExactQuote>();
const memoryStripeEvents = new Set<string>();

function newAccessToken(): string {
  return randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
}

async function db() {
  if (!firestoreConfigured()) return null;
  const { getAdminDb } = await import("@/lib/firebase/admin");
  return getAdminDb();
}

export async function saveQuote(quote: ExactQuote): Promise<void> {
  memoryQuotes.set(quote.quoteId, quote);
  const firestore = await db();
  if (firestore) {
    await firestore.collection("quotes").doc(quote.quoteId).set(quote, {
      merge: true,
    });
    return;
  }
  if (!allowLocalPersistence()) {
    // In-memory only for this instance — caller should know Firestore is preferred
    return;
  }
}

export async function getQuote(quoteId: string): Promise<ExactQuote | null> {
  const firestore = await db();
  if (firestore) {
    const snap = await firestore.collection("quotes").doc(quoteId).get();
    if (snap.exists) return snap.data() as ExactQuote;
  }
  return memoryQuotes.get(quoteId) ?? null;
}

export async function createPendingBooking(input: {
  quote: ExactQuote;
  contact: BookingRecord["contact"];
  idempotencyKey: string;
}): Promise<BookingRecord> {
  const existing = await findByIdempotencyKey(input.idempotencyKey);
  if (existing) return existing;

  const bookingId = `MPE-${Date.now().toString(36).toUpperCase()}-${randomUUID()
    .slice(0, 4)
    .toUpperCase()}`;
  const now = new Date().toISOString();
  const record: BookingRecord = {
    bookingId,
    createdAt: now,
    updatedAt: now,
    paymentStatus: "unpaid",
    quoteId: input.quote.quoteId,
    quoteSnapshot: input.quote,
    contact: input.contact,
    idempotencyKey: input.idempotencyKey,
    accessToken: newAccessToken(),
    emailsSent: false,
  };

  await persistBooking(record);
  return record;
}

async function findByIdempotencyKey(
  key: string
): Promise<BookingRecord | null> {
  const firestore = await db();
  if (firestore) {
    const snap = await firestore
      .collection("bookings")
      .where("idempotencyKey", "==", key)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0]!.data() as BookingRecord;
  }
  for (const b of memoryBookings.values()) {
    if (b.idempotencyKey === key) return b;
  }
  return null;
}

async function persistBooking(record: BookingRecord): Promise<void> {
  memoryBookings.set(record.bookingId, record);
  const firestore = await db();
  if (firestore) {
    await firestore.collection("bookings").doc(record.bookingId).set(record, {
      merge: true,
    });
    return;
  }
  if (!allowLocalPersistence()) return;
}

export async function getBooking(
  bookingId: string
): Promise<BookingRecord | null> {
  const firestore = await db();
  if (firestore) {
    const snap = await firestore.collection("bookings").doc(bookingId).get();
    if (snap.exists) return snap.data() as BookingRecord;
  }
  return memoryBookings.get(bookingId) ?? null;
}

export async function getBookingBySessionId(
  sessionId: string
): Promise<BookingRecord | null> {
  const firestore = await db();
  if (firestore) {
    const snap = await firestore
      .collection("bookings")
      .where("stripeCheckoutSessionId", "==", sessionId)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0]!.data() as BookingRecord;
  }
  for (const b of memoryBookings.values()) {
    if (b.stripeCheckoutSessionId === sessionId) return b;
  }
  return null;
}

export async function attachCheckoutSession(
  bookingId: string,
  sessionId: string
): Promise<BookingRecord | null> {
  const booking = await getBooking(bookingId);
  if (!booking) return null;
  booking.stripeCheckoutSessionId = sessionId;
  booking.paymentStatus = "checkout_pending";
  booking.updatedAt = new Date().toISOString();
  await persistBooking(booking);
  return booking;
}

export async function markBookingPaid(input: {
  bookingId: string;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
}): Promise<BookingRecord | null> {
  const booking = await getBooking(input.bookingId);
  if (!booking) return null;
  if (booking.paymentStatus === "paid") return booking; // idempotent

  if (
    booking.paymentStatus === "expired" ||
    booking.paymentStatus === "cancelled"
  ) {
    booking.paymentStatus = "needs_reconciliation";
    booking.updatedAt = new Date().toISOString();
    if (input.stripePaymentIntentId) {
      booking.stripePaymentIntentId = input.stripePaymentIntentId;
    }
    await persistBooking(booking);
    return booking;
  }

  booking.paymentStatus = "paid";
  booking.paidAt = new Date().toISOString();
  booking.updatedAt = booking.paidAt;
  if (input.stripePaymentIntentId) {
    booking.stripePaymentIntentId = input.stripePaymentIntentId;
  }
  if (input.stripeCheckoutSessionId) {
    booking.stripeCheckoutSessionId = input.stripeCheckoutSessionId;
  }
  await persistBooking(booking);
  return booking;
}

export async function markEmailsSent(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId);
  if (!booking) return;
  booking.emailsSent = true;
  booking.updatedAt = new Date().toISOString();
  await persistBooking(booking);
}

/** Idempotent Stripe event ledger */
export async function claimStripeEvent(eventId: string): Promise<boolean> {
  if (memoryStripeEvents.has(eventId)) return false;
  const firestore = await db();
  if (firestore) {
    const ref = firestore.collection("stripeEvents").doc(eventId);
    try {
      await firestore.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) throw new Error("duplicate");
        tx.set(ref, {
          eventId,
          receivedAt: new Date().toISOString(),
        });
      });
      memoryStripeEvents.add(eventId);
      return true;
    } catch {
      return false;
    }
  }
  memoryStripeEvents.add(eventId);
  return true;
}
