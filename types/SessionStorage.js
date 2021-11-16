class SessionStorage {

    /** Is user signed in
     * @type {boolean} */
    IsSignedIn;

    /** Horizon or Arbiter 
     * @type {"Horizon" | "Arbiter"} */
    SchedulingService;

    /** CalID of selected calendar
     * @type {{id: string, title: string}} */
    SelectedCalendar;

    /** Message to display in extension popup
     * @type {string} */
    StatusMessage;

    /** Sync Status
     * @type {string} */
    SyncStatus;
}