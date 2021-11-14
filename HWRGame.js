class HWRGame extends ScheduledGame {
    
    /**
     * @param {HTMLTableRowElement} row
     */
    constructor(row) {
        super(row);

        let cb = /** @type {HTMLInputElement} */ (row.cells[0].children[0]);
        super.checkbox = cb;

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

        super.gameID = row.id;
        // @ts-ignore
        super.date = moment(row.cells[DATE].innerText + " " + row.cells[TIME].innerText, "MM-DD-YYYY h:m a").format();
        super.time_hrs = Number(time_hrs);
        super.time_mins = Number(time_mins);
        super.level = row.cells[LEVEL].innerText;
        super.location = location_text;
        // @ts-ignore
        super.locationURL = row.cells[LOCATION].children[0].href;
        super.home = row.cells[HOME_TEAM].innerText;
        super.away = row.cells[AWAY_TEAM].innerText;
        super.pay = row.cells[PAY].innerText;
        // @ts-ignore
        super.detailsURL = row.cells[GAME_ID].children[0].href;
        super.officials = offs;
        super.calId = null;

        let locationURLParams = new URLSearchParams(this.locationURL);
        super.address = locationURLParams.get('daddr');

        try {
            if (row.cells[GAME_DETAILS].innerText.includes("CANCELLED")) {
                super.level = `[CANCELLED] ${super.level}`;
                super.isCancelled = true;
                cb.style.visibility = 'hidden';
            }

            if (row.cells[GAME_DETAILS].childElementCount >= 5) {
                super.isAccepted = false;
                cb.style.visibility = 'hidden';
            }
        } catch (error) {
            // ignore
        }

        super.eventDescription = this.getEventDescription();
    }
}