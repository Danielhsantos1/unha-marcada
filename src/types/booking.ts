import type { Service, Tenant } from "@/types/database";

export interface TimeSlot {
  /** "HH:MM" in 24h format, in the tenant's local time */
  time: string;
  available: boolean;
}

export interface BookingSelection {
  service: Service | null;
  date: string | null; // "YYYY-MM-DD"
  time: string | null; // "HH:MM"
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientNotes: string;
}

export const emptyBookingSelection: BookingSelection = {
  service: null,
  date: null,
  time: null,
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  clientNotes: "",
};

export interface CreateAppointmentResult {
  appointmentId: string;
  tenantSlug: string;
}

export interface TenantPublicData {
  tenant: Tenant;
  services: Service[];
}
