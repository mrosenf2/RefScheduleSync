import ScheduledGame from "./ScheduledGame.js";

export default class ARBGame extends ScheduledGame {


    /** @returns {Promise<string[]>} */
    getOfficials() {
        let _this = this;
        return new Promise(function (resolve, reject) {
            $.ajax(_this.detailsURL, {
                success: function (data) {
                    let offs = [];
                    let tblID = '#ctl00_ContentHolder_pgeGameView_conGameView_dgSlots';
                    let table = $(tblID, data)[0].children[0];
                    for (let i = 1; i <= 4; i++) {
                        try {
                            /** @type {string} */
                            let name = table.children[i].children[0].innerText.trim();
                            offs.push(name);
                        } catch (error) {
                            // ignore
                        }
                    }

                    resolve(offs);
                }, error: function (response) {
                    console.log(response);
                    reject(response);
                }
            });
        });
    }

    /** @returns {Promise<string>} */
    getLocation() {
        let locationURL = this.locationURL;
        return new Promise(function (resolve, reject) {
            $.ajax(locationURL, {
                success: (data) => {
                    let addrID = '#ctl00_ContentHolder_pgeRecordView_conRecordView_lnkAddress';
                    let table = $(addrID, data)[0];
                    let addr1 = table.children[0].innerText;
                    let addr2 = table.children[2].innerText;
                    resolve(`${addr1} ${addr2}`.trim());
                }, error: (response) => {
                    console.log(response);
                    reject(response);
                }
            });
        });
    }

    /**
     * @override
     */
    async init() {
        try {
            super.officials = await this.getOfficials();
            super.address = await this.getLocation();
            super.eventDescription = this.getEventDescription();
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
        super.row = row;
        super.gameID = row.cells[GAME_ID].innerText;
        let dateArr = row.cells[DATE].innerText.replace('\n', ' ').split(' ')
        super.startDate = new Date(`${dateArr[1]} ${dateArr[0]} ${dateArr[2]} ${dateArr[3]}`)
        super.level = row.cells[LEVEL].innerText;
        super.location = row.cells[LOCATION].innerText;
        super.address = "";
        super.home = row.cells[HOME_TEAM].innerText;
        super.away = row.cells[AWAY_TEAM].innerText;
        super.pay = row.cells[PAY].innerText;
        super.detailsURL = row.cells[GAME_ID].children[0].href;
        super.locationURL = row.cells[LOCATION].children[0].href;
        super.calId = null;
    }
}