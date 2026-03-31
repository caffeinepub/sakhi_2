import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    latitude: number;
    longitude: number;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface SOSAlert {
    status: SOSStatus;
    user: Principal;
    description: string;
    timestamp: bigint;
    location: Location;
}
export interface FIR {
    id: bigint;
    status: FIRStatus;
    title: string;
    linkedSOSId?: bigint;
    officerNotes?: string;
    user: Principal;
    description: string;
    timestamp: bigint;
    location: Location;
}
export interface EmergencyContact {
    name: string;
    phone: PhoneNumber;
}
export interface Profile {
    contacts: Array<EmergencyContact>;
    name: string;
    phone: PhoneNumber;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type PhoneNumber = string;
export interface IncidentReport {
    user: Principal;
    description: string;
    timestamp: bigint;
    location: Location;
}
export interface HeatmapPoint {
    latitude: number;
    longitude: number;
    severity: bigint;
    incidentType: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface SafeZone {
    name: string;
    address: string;
    location: Location;
}
export interface Notification {
    id: bigint;
    notifType: NotifType;
    userId: Principal;
    isRead: boolean;
    message: string;
    timestamp: bigint;
}
export enum FIRStatus {
    filed = "filed",
    closed = "closed",
    under_investigation = "under_investigation"
}
export enum NotifType {
    sos_update = "sos_update",
    fir_update = "fir_update",
    new_alert = "new_alert"
}
export enum SOSStatus {
    resolved = "resolved",
    active = "active",
    responded = "responded"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSafeZone(safeZone: SafeZone): Promise<bigint>;
    askChatbot(message: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createSOSAlert(location: Location, description: string): Promise<bigint>;
    fileFIR(title: string, description: string, location: Location, linkedSOSId: bigint | null): Promise<bigint>;
    getActiveAlertsCount(): Promise<bigint>;
    getAllActiveAlerts(): Promise<Array<SOSAlert>>;
    getAllFIRs(): Promise<Array<FIR>>;
    getAllIncidents(): Promise<Array<IncidentReport>>;
    getAllProfiles(): Promise<Array<Profile>>;
    getCallerRole(): Promise<UserRole>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCrimeHeatmapData(): Promise<Array<HeatmapPoint>>;
    getFIR(id: bigint): Promise<FIR | null>;
    getMyNotifications(): Promise<Array<Notification>>;
    getOwnFIRs(): Promise<Array<FIR>>;
    getOwnIncidents(): Promise<Array<IncidentReport>>;
    getOwnProfile(): Promise<Profile>;
    getOwnSOSAlerts(): Promise<Array<SOSAlert>>;
    getProfile(user: Principal): Promise<Profile>;
    getResolvedAlertsCount(): Promise<bigint>;
    getSafeZones(): Promise<Array<SafeZone>>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationRead(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    submitIncident(location: Location, description: string): Promise<bigint>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateFIRStatus(id: bigint, status: FIRStatus, officerNotes: string | null): Promise<void>;
    updateSOSStatus(id: bigint, status: SOSStatus): Promise<void>;
    upsertOwnProfile(profile: Profile): Promise<void>;
}
