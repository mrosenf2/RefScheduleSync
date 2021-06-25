class HWRGame {
    /** @type {HTMLInputElement} */
    checkbox;

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

    /** @type {boolean} */
    isCancelled;

    /** @type {boolean} */
    isAccepted = true;

    // TODO:
    /** @type {Number} */
    durationInMins;


    getEventDescription() {
        let eventDescription = JSON.stringify({
            Location: this.location,
            Home: this.home,
            Away: this.away,
            Officials: this.officials,
            Pay: this.pay,
            GameID: this.gameID,
        }, null, 2).replace(/[^a-zA-Z0-9\$\. \n:&\(\)\\\/<>]/g, "").slice(0, -1);
        return eventDescription;
    }


    /**
     * 
     * @param {HTMLInputElement} cb 
     * @param {HTMLTableRowElement} row
     */
    constructor(cb, row) {

        const GAME_ID = 0, DATE = 1, TIME = 2, LEVEL = 3, LOCATION = 6, HOME_TEAM = 4, AWAY_TEAM = 5, PAY = 7, OFFICIALS = 9, GAME_DETAILS = 10;
        let regex = /title:'(?<name>.*)',type:'',text:'(?<detail>.*)'/;
        let officials = [];
        let idxOfficial = 1;
        while (true) {
            try {
                let onClick = row.cells[OFFICIALS].children[idxOfficial].attributes.getNamedItem("onclick").value;
                let officialName = regex.exec(onClick).groups.name;
                let officialType = regex.exec(onClick).groups.detail;
                officials.push(`${officialName} (${officialType})`);
                idxOfficial += 3;
            } catch (err) {
                // ignore
                break;
            }
        }

        let regex_location = /showtip\(event, '<center><b><i>(?<location>.*?)<\/b><\/i>/;
        let locationMouseOver = row.cells[LOCATION].children[0].attributes["onmouseover"].value;
        let location_text = regex_location.exec(locationMouseOver).groups.location.replace("-", " ");


        let regex_duration = /(\d*) hour(s?) ?(\d*)/;
        let durationMouseOver = row.cells[TIME].children[0].attributes.getNamedItem("onmouseover").value;
        let duration_arr = regex_duration.exec(durationMouseOver).filter(h => (Number(h)));
        let time_hrs = duration_arr[0];
        let time_mins = 0;
        if (duration_arr.length > 1)
            time_mins = duration_arr[1];


        this.checkbox = cb;
        this.gameID = row.id;
        this.date = moment(row.cells[DATE].innerText + " " + row.cells[TIME].innerText, "MM-DD-YYYY h:m a").format();
        this.time_hrs = Number(time_hrs);
        this.time_mins = Number(time_mins);
        this.level = row.cells[LEVEL].innerText;
        this.location = location_text;
        this.locationURL = row.cells[LOCATION].children[0].href;
        this.home = row.cells[HOME_TEAM].innerText;
        this.away = row.cells[AWAY_TEAM].innerText;
        this.pay = row.cells[PAY].innerText;
        this.detailsURL = row.cells[GAME_ID].children[0].href;
        this.officials = officials;
        this.calId = null;

        let locationURLParams = new URLSearchParams(this.locationURL);
        this.address = locationURLParams.get('daddr');

        try {
            if (row.cells[GAME_DETAILS].innerText.includes("CANCELLED")) {
                this.level = `[CANCELLED] ${this.level}`;
                this.isCancelled = true;
                cb.style.visibility = 'hidden';
            }

            if (row.cells[GAME_DETAILS].childElementCount >= 5) {
                this.isAccepted = false;
                cb.style.visibility = 'hidden';
            }
        } catch (error) {
            // ignore
        }

        this.eventDescription = this.getEventDescription();
    }
}