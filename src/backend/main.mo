import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";



actor {
  // Authorization system initialization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Data Types
  type PhoneNumber = Text;
  type EmergencyContact = {
    name : Text;
    phone : PhoneNumber;
  };

  type Location = {
    latitude : Float;
    longitude : Float;
  };

  type Profile = {
    name : Text;
    phone : PhoneNumber;
    contacts : [EmergencyContact];
  };

  type SOSStatus = { #active; #responded; #resolved };

  type SOSAlert = {
    user : Principal;
    location : Location;
    description : Text;
    status : SOSStatus;
    timestamp : Int;
  };

  type IncidentReport = {
    user : Principal;
    description : Text;
    location : Location;
    timestamp : Int;
  };

  type SafeZone = {
    name : Text;
    address : Text;
    location : Location;
  };

  // FIR Types
  type FIRStatus = {
    #filed;
    #under_investigation;
    #closed;
  };

  type FIR = {
    id : Nat;
    user : Principal;
    title : Text;
    description : Text;
    location : Location;
    status : FIRStatus;
    timestamp : Int;
    officerNotes : ?Text;
    linkedSOSId : ?Nat;
  };

  // Notification types
  type NotifType = { #sos_update; #fir_update; #new_alert };
  type Notification = {
    id : Nat;
    userId : Principal;
    message : Text;
    isRead : Bool;
    timestamp : Int;
    notifType : NotifType;
  };

  // Persistent Storage
  // Phase 1
  let profiles = Map.empty<Principal, Profile>();
  let sosAlerts = Map.empty<Nat, SOSAlert>();
  let incidentReports = Map.empty<Nat, IncidentReport>();
  let safeZones = Map.empty<Nat, SafeZone>();

  // Phase 2
  let firs = Map.empty<Nat, FIR>();
  let notifications = Map.empty<Nat, Notification>();

  var nextSOSId = 0;
  var nextIncidentId = 0;
  var nextSafeZoneId = 0;
  var nextFIRId = 0;
  var nextNotificationId = 0;

  // Helper to check if user is police or admin
  func isPoliceOrAdmin(caller : Principal) : Bool {
    let role = AccessControl.getUserRole(accessControlState, caller);
    switch (role) {
      case (#admin) { true };
      case (#user) { false };
      case (#guest) { false };
    };
  };

  // Sorting helper for notifications
  func compareNotifications(notification1 : Notification, notification2 : Notification) : Order.Order {
    Nat.compare(notification2.timestamp.toNat(), notification1.timestamp.toNat());
  };

  // Helper functions for authorization checks
  func requireUser({ caller } : { caller : Principal }) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: User role required");
    };
  };

  func requirePoliceOrAdmin({ caller } : { caller : Principal }) {
    if (not isPoliceOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Police or admin role required");
    };
  };

  func requireAdmin({ caller } : { caller : Principal }) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
  };

  // Helper to get all police users
  func getAllPoliceUsers() : [Principal] {
    let policeList = List.empty<Principal>();
    for ((principal, _) in profiles.entries()) {
      if (isPoliceOrAdmin(principal)) {
        policeList.add(principal);
      };
    };
    policeList.toArray();
  };

  // User Management - Required by frontend
  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    requireUser({ caller });
    profiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    requireUser({ caller });
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func upsertOwnProfile(profile : Profile) : async () {
    requireUser({ caller });
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getOwnProfile() : async Profile {
    requireUser({ caller });
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getProfile(user : Principal) : async Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };
  };

  public query ({ caller }) func getAllProfiles() : async [Profile] {
    requireAdmin({ caller });
    profiles.values().toArray();
  };

  // Helper function to add notifications
  func addNotification(userId : Principal, message : Text, notifType : NotifType) {
    let notification : Notification = {
      id = nextNotificationId;
      userId;
      message;
      isRead = false;
      timestamp = Time.now();
      notifType;
    };
    notifications.add(nextNotificationId, notification);
    nextNotificationId += 1;
  };

  // SOS Alerts
  public shared ({ caller }) func createSOSAlert(location : Location, description : Text) : async Nat {
    requireUser({ caller });
    let id = nextSOSId;
    let alert : SOSAlert = {
      user = caller;
      location;
      description;
      status = #active;
      timestamp = Time.now();
    };
    sosAlerts.add(id, alert);
    nextSOSId += 1;

    // Notify all police users about new SOS alert
    let policeUsers = getAllPoliceUsers();
    for (policeUser in policeUsers.vals()) {
      addNotification(
        policeUser,
        "New SOS alert created: " # description,
        #new_alert
      );
    };

    id;
  };

  public shared ({ caller }) func updateSOSStatus(id : Nat, status : SOSStatus) : async () {
    switch (sosAlerts.get(id)) {
      case (null) { Runtime.trap("SOS Alert not found") };
      case (?alert) {
        switch (status) {
          case (#active) {
            if (caller != alert.user) {
              Runtime.trap("Unauthorized: Only the alert owner can set status to active");
            };
          };
          case (#responded) {
            if (not isPoliceOrAdmin(caller)) {
              Runtime.trap("Unauthorized: Only police or admin can mark alert as responded");
            };
          };
          case (#resolved) {
            requireAdmin({ caller });
          };
        };

        let updatedAlert : SOSAlert = {
          user = alert.user;
          location = alert.location;
          description = alert.description;
          status;
          timestamp = alert.timestamp;
        };
        sosAlerts.add(id, updatedAlert);

        // Notify SOS owner about status change
        let statusText = switch (status) {
          case (#active) { "active" };
          case (#responded) { "responded" };
          case (#resolved) { "resolved" };
        };
        addNotification(
          alert.user,
          "Your SOS alert status changed to: " # statusText,
          #sos_update
        );
      };
    };
  };

  public query ({ caller }) func getOwnSOSAlerts() : async [SOSAlert] {
    requireUser({ caller });
    let alerts = List.empty<SOSAlert>();
    for (alert in sosAlerts.values()) {
      if (alert.user == caller) {
        alerts.add(alert);
      };
    };
    alerts.toArray();
  };

  public query ({ caller }) func getAllActiveAlerts() : async [SOSAlert] {
    requirePoliceOrAdmin({ caller });
    let filtered = List.empty<SOSAlert>();
    for (alert in sosAlerts.values()) {
      if (alert.status == #active) {
        filtered.add(alert);
      };
    };
    filtered.toArray();
  };

  // Incident Reports
  public shared ({ caller }) func submitIncident(location : Location, description : Text) : async Nat {
    requireUser({ caller });
    let id = nextIncidentId;
    let report : IncidentReport = {
      user = caller;
      description;
      location;
      timestamp = Time.now();
    };
    incidentReports.add(id, report);
    nextIncidentId += 1;
    id;
  };

  public query ({ caller }) func getOwnIncidents() : async [IncidentReport] {
    requireUser({ caller });
    let incidents = List.empty<IncidentReport>();
    for (incident in incidentReports.values()) {
      if (incident.user == caller) {
        incidents.add(incident);
      };
    };
    incidents.toArray();
  };

  public query ({ caller }) func getAllIncidents() : async [IncidentReport] {
    requirePoliceOrAdmin({ caller });
    incidentReports.values().toArray();
  };

  // Safe Zones
  public shared ({ caller }) func addSafeZone(safeZone : SafeZone) : async Nat {
    requireAdmin({ caller });
    let id = nextSafeZoneId;
    safeZones.add(id, safeZone);
    nextSafeZoneId += 1;
    id;
  };

  public query ({ caller }) func getSafeZones() : async [SafeZone] {
    safeZones.values().toArray();
  };

  // DAO Helper : Get Caller Role
  public query ({ caller }) func getCallerRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  // Admin Stats
  public query ({ caller }) func getUserCount() : async Nat {
    requireAdmin({ caller });
    profiles.size();
  };

  public query ({ caller }) func getActiveAlertsCount() : async Nat {
    requireAdmin({ caller });
    var count = 0;
    for (alert in sosAlerts.values()) {
      if (alert.status == #active) {
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func getResolvedAlertsCount() : async Nat {
    requireAdmin({ caller });
    var count = 0;
    for (alert in sosAlerts.values()) {
      if (alert.status == #resolved) {
        count += 1;
      };
    };
    count;
  };

  // === FIR Management ===
  public shared ({ caller }) func fileFIR(title : Text, description : Text, location : Location, linkedSOSId : ?Nat) : async Nat {
    requireUser({ caller });
    let id = nextFIRId;
    let fir : FIR = {
      id;
      user = caller;
      title;
      description;
      location;
      status = #filed;
      timestamp = Time.now();
      officerNotes = null;
      linkedSOSId;
    };
    firs.add(id, fir);
    nextFIRId += 1;
    id;
  };

  public shared ({ caller }) func updateFIRStatus(id : Nat, status : FIRStatus, officerNotes : ?Text) : async () {
    requirePoliceOrAdmin({ caller });
    switch (firs.get(id)) {
      case (null) { Runtime.trap("FIR not found") };
      case (?fir) {
        let updatedFIR : FIR = {
          id = fir.id;
          user = fir.user;
          title = fir.title;
          description = fir.description;
          location = fir.location;
          status;
          timestamp = fir.timestamp;
          officerNotes;
          linkedSOSId = fir.linkedSOSId;
        };
        firs.add(id, updatedFIR);

        // Notify FIR owner about status change
        let statusText = switch (status) {
          case (#filed) { "filed" };
          case (#under_investigation) { "under investigation" };
          case (#closed) { "closed" };
        };
        addNotification(
          fir.user,
          "Your FIR status changed to: " # statusText,
          #fir_update
        );
      };
    };
  };

  public query ({ caller }) func getOwnFIRs() : async [FIR] {
    requireUser({ caller });
    let userFIRs = List.empty<FIR>();
    for (fir in firs.values()) {
      if (fir.user == caller) {
        userFIRs.add(fir);
      };
    };
    userFIRs.toArray();
  };

  public query ({ caller }) func getAllFIRs() : async [FIR] {
    requirePoliceOrAdmin({ caller });
    firs.values().toArray();
  };

  public query ({ caller }) func getFIR(id : Nat) : async ?FIR {
    switch (firs.get(id)) {
      case (null) { null };
      case (?fir) {
        if (caller != fir.user and not isPoliceOrAdmin(caller)) {
          Runtime.trap("Unauthorized: Can only view your own FIR or must be police/admin");
        };
        ?fir;
      };
    };
  };

  // === Crime Heatmap Data ===
  type HeatmapPoint = {
    latitude : Float;
    longitude : Float;
    incidentType : Text;
    severity : Nat;
  };

  public query ({ caller }) func getCrimeHeatmapData() : async [HeatmapPoint] {
    requirePoliceOrAdmin({ caller });

    let points = List.empty<HeatmapPoint>();

    for (incident in incidentReports.values()) {
      let point : HeatmapPoint = {
        latitude = incident.location.latitude;
        longitude = incident.location.longitude;
        incidentType = "incident";
        severity = 2;
      };
      points.add(point);
    };

    for (alert in sosAlerts.values()) {
      let point : HeatmapPoint = {
        latitude = alert.location.latitude;
        longitude = alert.location.longitude;
        incidentType = "sos";
        severity = switch (alert.status) {
          case (#active) { 3 };
          case (#responded) { 2 };
          case (#resolved) { 1 };
        };
      };
      points.add(point);
    };

    points.toArray();
  };

  // === Notifications ===
  public query ({ caller }) func getMyNotifications() : async [Notification] {
    requireUser({ caller });
    let userNotifs = List.empty<Notification>();
    for (notif in notifications.values()) {
      if (notif.userId == caller) {
        userNotifs.add(notif);
      };
    };

    let notifArray = userNotifs.toArray();

    notifArray.sort(compareNotifications);
  };

  public shared ({ caller }) func markNotificationRead(id : Nat) : async () {
    switch (notifications.get(id)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notif) {
        if (notif.userId != caller) {
          Runtime.trap("Unauthorized: Not your notification");
        };
        let updatedNotif : Notification = {
          id = notif.id;
          userId = notif.userId;
          message = notif.message;
          isRead = true;
          timestamp = notif.timestamp;
          notifType = notif.notifType;
        };
        notifications.add(id, updatedNotif);
      };
    };
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    requireUser({ caller });
    var count = 0;
    for (notif in notifications.values()) {
      if (notif.userId == caller and not notif.isRead) {
        count += 1;
      };
    };
    count;
  };

  // === AI Chatbot ===
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func askChatbot(message : Text) : async Text {
    requireUser({ caller });

    let url = "https://mockaiapi.com/chatbot?message=" # message;

    try {
      await OutCall.httpGetRequest(url, [], transform);
    } catch (_) {
      let safetyTips = [
        "Always share your location with trusted contacts when traveling.",
        "Avoid walking alone at night in unfamiliar areas.",
        "Trust your instincts, if you feel unsafe, seek help immediately.",
        "Keep emergency numbers saved and easily accessible.",
        "Be aware of your surroundings and stay alert.",
      ];

      let timestamp = Time.now();
      let index = (timestamp.toNat() % 1000) % 5;
      return safetyTips[index];
    };
  };
};
