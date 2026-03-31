import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FIRStatus,
  Location,
  Profile,
  SOSStatus,
  SafeZone,
} from "../backend.d";
import { useActor } from "./useActor";

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useOwnSOSAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["ownSOSAlerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOwnSOSAlerts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSafeZones() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["safeZones"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSafeZones();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSOSAlert() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lat,
      lng,
      desc,
    }: { lat: number; lng: number; desc: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createSOSAlert({ latitude: lat, longitude: lng }, desc);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownSOSAlerts"] }),
  });
}

export function useSubmitIncident() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lat,
      lng,
      desc,
    }: { lat: number; lng: number; desc: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitIncident({ latitude: lat, longitude: lng }, desc);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownIncidents"] }),
  });
}

export function useUpsertProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!actor) throw new Error("Not connected");
      return actor.upsertOwnProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["callerProfile"] }),
  });
}

// Police queries
export function useAllActiveAlerts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allActiveAlerts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllActiveAlerts();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000,
  });
}

export function useAllIncidents() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allIncidents"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllIncidents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSOSStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: bigint; status: SOSStatus }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateSOSStatus(id, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allActiveAlerts"] }),
  });
}

// Admin queries
export function useUserCount() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUserCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveAlertsCount() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["activeAlertsCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getActiveAlertsCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useResolvedAlertsCount() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["resolvedAlertsCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getResolvedAlertsCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSafeZone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zone: SafeZone) => {
      if (!actor) throw new Error("Not connected");
      return actor.addSafeZone(zone);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safeZones"] }),
  });
}

// Phase 2: FIR
export function useOwnFIRs() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["ownFIRs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOwnFIRs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllFIRs() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allFIRs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFIRs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFileFIR() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      location,
      linkedSOSId,
    }: {
      title: string;
      description: string;
      location: Location;
      linkedSOSId: bigint | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.fileFIR(title, description, location, linkedSOSId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ownFIRs"] }),
  });
}

export function useUpdateFIRStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      officerNotes,
    }: {
      id: bigint;
      status: FIRStatus;
      officerNotes: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateFIRStatus(id, status, officerNotes);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allFIRs"] }),
  });
}
