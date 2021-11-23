import ParsedGame from "./ParsedGame.js";

const toMilis = (/** @type {number} */ hrs, /** @type {number} */ mins) => hrs * 60 * 60 * 1000 + mins * 60 * 1000;
export default class ARBGame extends ParsedGame {


    /** @returns {Promise<string[]>} */
    async getOfficials() {
        let detailsURL = this.detailsURL;

        try {
            const resp = await fetch(detailsURL);
            let data = await resp.text();
            let offs = [];
            //let tblID = '#ctl00_ContentHolder_pgeGameView_conGameView_dgSlots';
            // let table = $(tblID, data)[0].children[0];
            let tblID = 'ctl00_ContentHolder_pgeGameView_conGameView_dgSlots';
            let doc = new DOMParser().parseFromString(data, 'text/html');
            let table = doc.getElementById(tblID).getElementsByTagName('tbody')[0];

            for (let i = 1; i <= 4; i++) {
                try {
                    let name = /** @type {HTMLElement} */ (table.children[i].children[0]).innerText.trim();
                    offs.push(name);
                } catch (error) {
                    // ignore
                }
            }
            return offs;
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    /** @returns {Promise<string>} */
    async getLocation() {
        let locationURL = this.locationURL;
        try {
            const resp = await fetch(locationURL);
            let data = await resp.text();
            let addrID = '#ctl00_ContentHolder_pgeRecordView_conRecordView_lnkAddress';
            let table = $(addrID, data)[0];
            let addr1 = /** @type {HTMLElement} */ (table.children[0]).innerText;
            let addr2 = /** @type {HTMLElement} */ (table.children[2]).innerText;
            return (`${addr1} ${addr2}`.trim());
        } catch (error) {
            console.log(error);
            return error;
        }
    }

    /**
     * @override
     */
    async init() {
        try {
            super.officials = await this.getOfficials();
            super.address = await this.getLocation();
        } catch (error) {
            console.log('Error:', error);
        }

    }

    /**
     * 
     * @param {HTMLTableRowElement} row
     */
    constructor(row, isSignedIn = true) {
        super(row);

        /** @type {boolean} */ let isAccepted;
        /** @type {HTMLInputElement} */ let cb;
        if (![...row.cells].find(c => c.className == 'sync')) {
            //create sync checkbox
            cb = document.createElement("input");
            cb.type = "checkbox";

            if (row.cells.length >= 11) {
                isAccepted = row.cells[10].textContent.search("Accepted") > 0;
            }

            if (!isSignedIn || !isAccepted) {
                cb.disabled = true;
                console.trace('cb.disabled = true');
            }
            row.cells[2].replaceChildren(cb);
            row.cells[2].className = "sync";

        } else {
            cb = /** @type {HTMLInputElement} */ (row.cells[2].children[0]);
        }

        this.checkbox = cb;

        // dynamically find correct indices as table columns may change
        const getIndex = (headerLabel) => [...document.querySelector("#ctl00_ContentHolder_pgeGameScheduleEdit_conGameScheduleEdit_dgGames > tbody > tr.headers").children]
            .findIndex(td => /** @type {HTMLTableCellElement} */(td).innerText.includes(headerLabel));

        const GAME_ID = getIndex('Game'),
            DATE = getIndex('Date'),
            LEVEL = getIndex('Level'),
            LOCATION = getIndex('Site'),
            HOME_TEAM = getIndex('Home'),
            AWAY_TEAM = getIndex('Away'),
            PAY = getIndex('Fees');

        this.gameID = row.cells[GAME_ID].innerText;

        let [prsDate, prsTime] = row.cells[DATE].innerText.split('\n');
        // [prsDate, prsTime] will be: [12/1/2019 Sun, 8:50 AM]
        this.startDate = new Date(`${prsDate.split(' ')[0]} ${prsTime}`);
        // add 1hr 20mins to start by default

        this.endDate = new Date(this.startDate.getTime() + toMilis(1, 20));
        this.level = row.cells[LEVEL].innerText;
        this.location = row.cells[LOCATION].innerText;
        this.address = "";
        this.home = row.cells[HOME_TEAM].innerText;
        this.away = row.cells[AWAY_TEAM].innerText;
        this.pay = row.cells[PAY].innerText;
        this.detailsURL = /** @type {HTMLLinkElement} */ (row.cells[GAME_ID].children[0]).href;
        this.locationURL = /** @type {HTMLLinkElement} */ (row.cells[LOCATION].children[0]).href;
        this.calId = null;
    }
}