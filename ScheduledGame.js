export default class ParsedGame {

    /**
     * @param {HTMLTableRowElement} row
     */
    constructor(row) {
        this.row = row;
    }

    /** 
     * @type {HTMLInputElement} 
     * @public
    */
    checkbox;

    /** @type {HTMLTableRowElement} */
    row;

    /** @type {string} */
    gameID;

    /** @type {Date} */
    startDate;

    /** @type {Date} */
    endDate;

    /** @type {Number} */
    duration_hrs;

    /** @type {Number} */
    duration_mins;

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

    /** @type {boolean} */
    isCancelled;

    /** @type {boolean} */
    isAccepted = true;
    
    async init() {

    }

    /**
     * @param {ParsedGame} serializedGameObj
     * @returns {ParsedGame}
     */
    static Deserialize(serializedGameObj) {
        let gameObj = Object.assign(new ParsedGame(null), serializedGameObj);
        gameObj.startDate = new Date(serializedGameObj.startDate);
        gameObj.endDate = new Date(serializedGameObj.endDate);
        return gameObj;
    }

    get canDelete() {
        return this.CalendarEvent?.extendedProperties?.private?.extension_id ? true : false;
    }

    /** @type {CalendarEvent} Google Calendar Event object */
    CalendarEvent;

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