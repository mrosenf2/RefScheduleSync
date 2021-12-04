import Common from "./commonContent.js";
import LocalStorageService from "./services/LocalStorageService.js";
import { AuthService, CalendarService } from "./services/ipc.js";
import ARBGame from "./ARBGame.js";

export default class ArbiterContent extends Common {

    tbID = "ctl00_ContentHolder_pgeGameScheduleEdit_conGameScheduleEdit_dgGames";

    isGameSchedulePage() {
        // TODO...
        return true;
    }

    getScheduleTableRows() {
        return /** @type {NodeListOf<HTMLTableRowElement>} */(document.querySelectorAll('tr.headers, tr.items, tr.alternatingItems'));
    }

    /**
     * Adds column to table. Sends info about games to background listener.
     */
    async addSyncColumn() {
        let totalPay = 0;


        const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');
        let rows = [...this.getScheduleTableRows()];
        rows.forEach(row => row.insertCell(2));

        let [headerRow, ...itemRows] = rows;

        // create sync row header
        this.txtIsSignedIn = this.CreateElementSignInSync(isSignedIn);
        headerRow.cells[2].replaceChildren(this.txtIsSignedIn);

        let parsedGames = itemRows.map(row => new ARBGame(row, isSignedIn));

        let el = document.createElement("p");
        totalPay = parsedGames
            .map(g => Number(g.pay.replace(/[^0-9.-]+/g, "")))
            .reduce((prev, cur) => prev + cur, 0);

        el.innerText = "Total: " + totalPay.toString();
        document.getElementById(this.tbID).appendChild(el);

    };


    async sync(addOnClick = false, promptAddGames = false) {
        let tblRows = this.getScheduleTableRows();

        // First, gather data from all games on page

        let arbGames = [...tblRows]
            .filter(row => row.className.toLowerCase().includes("items"))
            .map(row => new ARBGame(row));

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
