import ParsedGame from "./ScheduledGame.js";

export default class ARBGame extends ParsedGame {


    /** @returns {Promise<string[]>} */
    async getOfficials() {
        let detailsURL = this.detailsURL;

        try {
            const resp = await fetch(detailsURL);
            let data = await resp.text();
            let offs = [];
            let tblID = '#ctl00_ContentHolder_pgeGameView_conGameView_dgSlots';
            let table = $(tblID, data)[0].children[0];
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
            let data = await resp.text()
            let addrID = '#ctl00_ContentHolder_pgeRecordView_conRecordView_lnkAddress';
            let table = $(addrID, data)[0];
            let addr1 = /** @type {HTMLElement} */ (table.children[0]).innerText;
            let addr2 = /** @type {HTMLElement} */ (table.children[2]).innerText;
            return (`${addr1} ${addr2}`.trim());
        } catch (error) {
            console.log(error);
            return error
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
    constructor(row) {
        super(row);

        let cb = /** @type {HTMLInputElement} */ (row.cells[2].children[0]);
        super.checkbox = cb;

        const GAME_ID = 0, DATE = 4, LEVEL = 5, LOCATION = 6, HOME_TEAM = 7, AWAY_TEAM = 8, PAY = 9;
        super.gameID = row.cells[GAME_ID].innerText;
        let dateArr = row.cells[DATE].innerText.replace('\n', ' ').split(' ');
        super.startDate = new Date(`${dateArr[1]} ${dateArr[0]} ${dateArr[2]} ${dateArr[3]}`);
        // add 1hr 20mins to start by default
        super.endDate = new Date(super.startDate.getTime() + 1 * 60 * 60 * 1000 + 20 * 60 * 1000);
        super.level = row.cells[LEVEL].innerText;
        super.location = row.cells[LOCATION].innerText;
        super.address = "";
        super.home = row.cells[HOME_TEAM].innerText;
        super.away = row.cells[AWAY_TEAM].innerText;
        super.pay = row.cells[PAY].innerText;
        super.detailsURL = /** @type {HTMLLinkElement} */ (row.cells[GAME_ID].children[0]).href;
        super.locationURL = /** @type {HTMLLinkElement} */ (row.cells[LOCATION].children[0]).href;
        super.calId = null;
    }
}