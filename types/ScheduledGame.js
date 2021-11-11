class ScheduledGame {

    constructor(cb, row) {
        this.checkbox = cb;
        this.row = row;
    }

    /** @type {HTMLInputElement} */
    checkbox;

    /** @type {HTMLTableRowElement} */
    row;

    /** @type {string} */
    gameID;

    /** @type {string} */
    date;

    /** @type {Number} */
    time_hrs;

    /** @type {Number} */
    time_mins;

    /** @type {string} */
    level;

    /** @type {string} */
    location;

    /** @type {string} */
    locationURL;

    /** @type {string} */
    address;

    /** @type {string} */
    home;

    /** @type {string} */
    away;

    /** @type {string} */
    pay;

    /** @type {string} */
    detailsURL;

    /** @type {string[]} */
    officials;

    /** @type {string} */
    calId;

    /** @type {string} */
    eventDescription;

    /** @type {boolean} */
    isCancelled;

    /** @type {boolean} */
    isAccepted = true;

    // TODO:
    /** @type {Number} */
    durationInMins;

    getEventDescription() {
        return JSON.stringify({
            Location: this.location,
            Home: this.home,
            Away: this.away,
            Officials: this.officials,
            Pay: this.pay,
            GameID: this.gameID,
        }, null, 2).replace(/[^a-zA-Z0-9\$\. \n:&\(\)\\\/<>]/g, "").slice(0, -1);
    }
}