'use strict';

import LocalStorageService from "./services/LocalStorageService.js";
import Common from "./commonContent.js";
import HWRGame from "./HWRGame.js";
import { AuthService, CalendarService } from "./services/ipc.js";

export default class HorizonContent {
    tbID = "schedResults";
    btnIsSignedIn = "isSignedIn";
    /** @type {HTMLParagraphElement} */
    txtIsSignedIn;

    titleText = 'Official Game Schedule';

    isGameSchedulePage() {
        let titleEl = [...document.getElementsByTagName('i')]
            .filter((e) => e.textContent.includes(this.titleText));
        return titleEl.length > 0;
    }

    /**
    * Adds column to table. Sends info about games to background listener.
    */
    async addSyncColumn() {

        if (!this.isGameSchedulePage()) {
            console.log(`Expected title ${this.titleText} not found`);
            return;
        }

        const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');

        let tblRows = /** @type {HTMLCollectionOf<HTMLTableRowElement>} */
            (document.getElementById(this.tbID).children[0].children);


        /** @type {HWRGame[]} */
        let stgGames = [];
        /** @type {boolean} */
        let isAccepted;

        for (let row of tblRows) {
            if (row.cells) {
                if (!row.id.toLowerCase().includes("assignment")) {

                    this.txtIsSignedIn = Common.CreateElementSignInSync(isSignedIn);
                    this.txtIsSignedIn.id = this.btnIsSignedIn;
                    this.txtIsSignedIn.onclick = () => {
                        Common.SignInSyncHandler(this.sync.bind(this));
                    };

                    row.cells[0].replaceChildren(this.txtIsSignedIn);
                }
                else {
                    //create sync checkbox
                    var cb = document.createElement("input");
                    cb.type = "checkbox";
                    if (row.cells.length >= 11) {
                        isAccepted = true;
                    }

                    if (!isSignedIn || !isAccepted) {
                        cb.disabled = true;
                        console.log('cb.disabled = true', { isSignedIn, isAccepted });
                    }
                    row.cells[0].replaceChildren(cb);
                    stgGames.push(new HWRGame(row));
                }
            }
        }
        for (let i = 0; i < stgGames.length - 1; i++) {
            const g1 = stgGames[i];
            const g2 = stgGames[i + 1];
            if (checkTimeBetweenGames(g1, g2)) {
                g2.row.classList.add("warnTimeBetweenGames");
                console.log(g2.row);
            }

        }

        /**
         * @param {HWRGame} g1 
         * @param {HWRGame} g2 
         * @returns {Boolean}
         */
        function checkTimeBetweenGames(g1, g2) {
            if (g1.address == g2.address) {
                return false;
            }

            const date1 = new Date(g1.startDate);
            const date2 = new Date(g2.startDate);

            return date1.toDateString() == date2.toDateString()
                && getHoursAndMins(date2) <= getHoursAndMins(date1) + g1.time_hrs + (g1.time_mins / 60) + 1;
        }

        /**
         * @param {Date} d 
         */
        function getHoursAndMins(d) {
            return d.getHours() + d.getMinutes() / 60;
        }
    }


    /**
     * @param {HWRGame} game
     */
    cbClicked(game) {
        Common.onCBClicked(game);
    }
    

    /**
     * 
     * @param {HWRGame} gameToUpdate 
     */
    async updateDesc(gameToUpdate) {
        console.log('updating desc of', { gameToUpdate });
        const isUpdateSuccess = CalendarService.removeGame(gameToUpdate);
        if (!isUpdateSuccess) {
            gameToUpdate.checkbox.checked = true;
            alert("error occurred; calendar not updated");
        } else {
            const isAddSuccess = await CalendarService.addGame(gameToUpdate);
            if (!isAddSuccess.ok) {
                alert(`ERROR UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.startDate})`);
            } else {
                alert(`UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.startDate})`);
                console.log('update success');
            }
        }
    }

    async sync(addOnClick = false, promptAddGames = false) {

        const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');
        if (!isSignedIn) {
            return;
        }

        let tbID = this.tbID;
        let tblRows = /** @type {HTMLCollectionOf<HTMLTableRowElement>} */
            (document.getElementById(tbID).children[0].children);

        // First, gather data from all games on page

        /** @type {HWRGame[]} */
        let hwrGames = [];
        for (let row of tblRows) {
            if (row.id.toLowerCase().includes("assignment")) {
                hwrGames.push(new HWRGame(row));
            }
        }
        if (hwrGames.length == 0) {
            return;
        }

        /** @type {CalendarEvent[]} */
        let events;
        try {
            let minDate = hwrGames[0].startDate;
            let maxDate = hwrGames[hwrGames.length - 1].startDate;
            events = await CalendarService.getEvents(minDate.toISOString(), maxDate.toISOString());
        } catch (err) {
            const msg = `unable to fetch events from calendar. Try refreshing the page.\n ${err}`;
            alert(msg);
            console.error(msg, err);
            this.txtIsSignedIn.innerHTML = "Refresh";
            for (let gameObj of hwrGames) {
                gameObj.checkbox.disabled = true;
            }
            LocalStorageService.SetValue('SyncStatus', 'unable to fetch events from calendar.');
            return;
        }


        let uncheckedGames = [];
        for (let gameObj of hwrGames) {

            var match = events.find(ev => ev.description?.includes(gameObj.gameID.replace("-", "")));
            let cb = gameObj.checkbox;
            let isDisabled = cb.disabled;
            cb.disabled = true;
            if (match) {
                cb.checked = true;
                cb.title = match.id;
                gameObj.calId = match.id;

                // remove duplicates
                // TODO: avoid rate limiting
                let duplicateMatches = events.filter(ev => ev.description?.includes(gameObj.gameID.replace("-", "")));
                while (duplicateMatches.length > 1) {
                    console.log(`multipleMatches.length: ${duplicateMatches.length}`);
                    let dupGame = duplicateMatches.pop();
                    gameObj.calId = dupGame.id;
                    const isSuccess = await CalendarService.removeGame(gameObj);
                    if (!isSuccess) {
                        alert("error occurred removing duplicate; calendar not updated");
                    } else {
                        console.log('removed duplicate');
                    }
                }

                gameObj.calId = match.id;

                let isUpdateDesc = match.description != gameObj.eventDescription;

                if (isUpdateDesc) {
                    this.updateDesc(gameObj);
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
            cb.disabled = isDisabled;
        }

        LocalStorageService.SetValue('SyncStatus', 'In Sync');

        if (promptAddGames) {
            await Common.AddUncheckedGames(uncheckedGames);
        }
    };
}


