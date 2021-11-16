import ScheduledGame from "./ScheduledGame.js";

export default class HWRGame extends ScheduledGame {
    
    /**
     * @param {HTMLTableRowElement} row
     */
    constructor(row) {
        super(row);

        let cb = /** @type {HTMLInputElement} */ (row.cells[0].children[0]);
        this.checkbox = cb;

        const GAME_ID = 0, DATE = 1, TIME = 2, LEVEL = 3, LOCATION = 6, HOME_TEAM = 4, AWAY_TEAM = 5, PAY = 7, OFFICIALS = 9, GAME_DETAILS = 10;
        let regex = /title:'(?<name>.*)',type:'',text:'(?<detail>.*)'/;
        let offs = [];
        let idxOfficial = 1;
        while (true) {
            try {
                let onClick = row.cells[OFFICIALS].children[idxOfficial].attributes.getNamedItem("onclick").value;
                let officialName = regex.exec(onClick).groups.name;
                let officialType = regex.exec(onClick).groups.detail;
                offs.push(`${officialName} (${officialType})`);
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
        let duration_arr = regex_duration.exec(durationMouseOver).filter(h => (Number(h))).map(n => Number(n));
        let time_hrs = duration_arr[0];
        let time_mins = 0;
        if (duration_arr.length > 1)
            time_mins = duration_arr[1];

        this.gameID = row.id;
        this.startDate = new Date(Date.parse(row.cells[DATE].innerText + " " + row.cells[TIME].innerText.replace('pm', ' pm')))
        this.time_hrs = Number(time_hrs);
        this.time_mins = Number(time_mins);
        this.endDate = new Date(this.startDate.getTime() + this.time_hrs * 60 * 60 * 1000 + this.time_mins * 60 * 1000)
        this.level = row.cells[LEVEL].innerText;
        this.location = location_text;
        // @ts-ignore
        this.locationURL = row.cells[LOCATION].children[0].href;
        this.home = row.cells[HOME_TEAM].innerText;
        this.away = row.cells[AWAY_TEAM].innerText;
        this.pay = row.cells[PAY].innerText;
        // @ts-ignore
        this.detailsURL = row.cells[GAME_ID].children[0].href;
        this.officials = offs;
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