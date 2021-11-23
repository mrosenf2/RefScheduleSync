import Common from "./commonContent.js";
import LocalStorageService from "./services/LocalStorageService.js";
import { AuthService, CalendarService } from "./services/ipc.js";
import ARBGame from "./ARBGame.js";

export default class ArbiterContent extends Common {

    
    tbID = "ctl00_ContentHolder_pgeGameScheduleEdit_conGameScheduleEdit_dgGames";

    /**
     * Adds column to table. Sends info about games to background listener.
     */
    async addSyncColumn() {
        let tbID = this.tbID;
        let tblRows = /** @type {HTMLCollectionOf<HTMLTableRowElement>} */
            (document.getElementById(tbID).children[0].children);
        let totalPay = 0;

        /** @type {ARBGame[]} */
        let stgGames = [];



        const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');

        
        for (let row of tblRows) {
            row.insertCell(2);
            if (row.className.toLowerCase().includes("headers")) {
                // create sync row header
                this.txtIsSignedIn = this.CreateElementSignInSync(isSignedIn);
                row.cells[2].replaceChildren(this.txtIsSignedIn);
            }
            if (row.className.toLowerCase().includes("items")) {
                stgGames.push(new ARBGame(row, isSignedIn));
            }
        }
        let el = document.createElement("p");
        totalPay = stgGames
            .map(g => Number(g.pay.replace(/[^0-9.-]+/g, "")))
            .reduce((prev, cur) => prev + cur, 0);
            
        el.innerText = "Total: " + totalPay.toString();
        document.getElementById(tbID).appendChild(el);

    };


    async sync(addOnClick = false, promptAddGames = false) {
        let tbID = this.tbID;
        let tblRows = /** @type {HTMLCollectionOf<HTMLTableRowElement>} */
            (document.getElementById(tbID).children[0].children);



        // First, gather data from all games on page

        /** @type {ARBGame[]} */
        let arbGames = [];
        for (let row of tblRows) {
            if (row.className.toLowerCase().includes("items")) {
                arbGames.push(new ARBGame(row));
            }
        }
        if (arbGames.length == 0) {
            return;
        }

        let events = await this.getEvents(arbGames);
        if (events == undefined) {
            return;
        }

        let uncheckedGames = [];
        let isCanceled = false;
        for (let gameObj of arbGames) {
            let cb = gameObj.checkbox;
            let row = gameObj.row;
            if (row.cells.length >= 11) {
                isCanceled = row.cells[10].textContent.search("Canceled") > 0;
            }
            let match = events.find(ev => ev.description?.includes(gameObj.gameID));
            if (match) {
                cb.checked = true;
                cb.title = match.id;
                gameObj.calId = match.id;
                gameObj.CalendarEvent = match;


                if (isCanceled) {
                    //remove game to calendar
                    CalendarService.removeGame(gameObj).then((isSuccess) => {
                        if (!isSuccess) {
                            gameObj.checkbox.checked = true;
                            alert("error occurred; calendar not updated");
                        }
                        this.sync();
                        gameObj.checkbox.disabled = false;
                    });
                }
            } else {
                cb.checked = false;
                cb.title = "n/a";
                gameObj.calId = null;
                uncheckedGames.push(gameObj);
            }
            if (addOnClick) {
                cb.addEventListener('click', Common.onCBClicked.bind(this, gameObj));
            }
            cb.disabled = false;
        }

        LocalStorageService.SetValue('SyncStatus', 'In Sync');

        if (promptAddGames) {
            await Common.AddUncheckedGames(uncheckedGames);
        }
    };

    // export default arbiterContent;
}
