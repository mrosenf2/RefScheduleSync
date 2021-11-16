import Common from "./commonContent.js";
import LocalStorageService from "./services/LocalStorageService.js";
import { AuthService, CalendarService } from "./services/ipc.js";
import ARBGame from "./ARBGame.js";

export default class ArbiterContent {

    btnIsSignedIn = "isSignedIn";
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

        /** @type {Boolean} */
        let isAccepted;
        for (let row of tblRows) {
            row.insertCell(2);
            if (row.className.toLowerCase().includes("headers")) {
                let txtIsSignedIn = Common.CreateElementSignInSync(isSignedIn);
                txtIsSignedIn.id = this.btnIsSignedIn;
                txtIsSignedIn.onclick = () => {
                    Common.SignInSyncHandler(this.sync.bind(this));
                };
                row.cells[2].replaceChildren(txtIsSignedIn);
            }
            if (row.className.toLowerCase().includes("items")) {
                //create sync checkbox
                let cb = document.createElement("input");
                cb.type = "checkbox";

                if (row.cells.length >= 11) {
                    isAccepted = row.cells[10].textContent.search("Accepted") > 0;
                }

                if (!isSignedIn || !isAccepted) {
                    cb.disabled = true;
                    console.trace('cb.disabled = true');
                }
                row.cells[2].replaceChildren(cb);
                let gameObj = new ARBGame(row);
                stgGames.push(gameObj);
                totalPay += Number(gameObj.pay.replace(/[^0-9.-]+/g, ""));
            }
        }
        let el = document.createElement("p");
        el.innerText = "Total: " + totalPay.toString();
        document.getElementById(tbID).appendChild(el);

    };


    async sync(addOnClick = false, prompAddGames = false) {
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

        /** @type {CalendarEvent[]} */
        let events;
        try {
            let minDate = arbGames[0].startDate;
            let maxDate = arbGames[arbGames.length - 1].startDate;
            events = await CalendarService.getEvents(minDate, maxDate);
        } catch (err) {
            alert(`unable to fetch events from calendar. Try refreshing the page.\n ${err}`);
            document.getElementById(this.btnIsSignedIn).innerHTML = "Refresh";
            for (let gameObj of arbGames) {
                gameObj.checkbox.disabled = true;
            }
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

        if (prompAddGames) {
            await Common.AddUncheckedGames(uncheckedGames);
        }
    };

    // export default arbiterContent;
}
