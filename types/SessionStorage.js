/**
 * App State
 * @typedef {Object} SessionStorage
 * 
 * @property {boolean} IsSignedIn
 * Is user signed in
 * 
 * @property {"Horizon" | "Arbiter"} [SchedulingService]
 * 
 * @property {{id: string, title: string}} SelectedCalendar 
 * CalID of selected calendar
 * 
 * @property {string} StatusMessage
 * Message to display in extension popup
 * 
 * @property {string} SyncStatus
 * 
 * @property {string} SelectedTimezone
 * Timezone user has selected. When undefined, use system default
 * 
 */