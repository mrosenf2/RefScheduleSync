'use strict';

import LocalStorageService from "./services/LocalStorageService.js";
import Common from "./commonContent.js";
import HWRGame from "./HWRGame.js";
import { CalendarService } from "./services/ipc.js";

export default class HorizonContent extends Common {
    tbID = "schedResults";
    titleText = 'Official Game Schedule';

    isGameSchedulePage() {
        let titleEl = [...document.getElementsByTagName('i')]
            .filter((e) => e.textContent.includes(this.titleText));
        return titleEl.length > 0;
    }

    getScheduleTableRows() {
        return /** @type {NodeListOf<HTMLTableRowElement>} */(document.querySelectorAll(`#${this.tbID} tr`));
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
        let [headerRow, ...itemRows] = this.getScheduleTableRows();

        // create sync row header
        this.txtIsSignedIn = this.CreateElementSignInSync(isSignedIn);
        headerRow.cells[0].replaceChildren(this.txtIsSignedIn);

        let parsedGames = itemRows.map(row => new HWRGame(row, isSignedIn));

        for (let i = 0; i < parsedGames.length - 1; i++) {
            const g1 = parsedGames[i];
            const g2 = parsedGames[i + 1];
            if (this.checkTimeBetweenGames(g1, g2)) {
                g2.row.classList.add("warnTimeBetweenGames");
            }

        }
    }

    /**
         * @param {HWRGame} g1 
         * @param {HWRGame} g2 
         * @returns {Boolean}
         */
    checkTimeBetweenGames(g1, g2) {
        if (g1.address == g2.address) {
            return false;
        }

        // check that game 2 starts at least 1 hour after game 1 ends
        return g2.startDate.getTime() <= g1.endDate.getTime() + 1000 * 60 * 60;

    }


    /**
     * 
     * @param {HWRGame} gameToUpdate 
     */
    async updateDesc(gameToUpdate) {
        console.log('updating desc of', { gameToUpdate });
        const isUpdateSuccess = await CalendarService.updateGame(gameToUpdate);
        if (!isUpdateSuccess.ok) {
            alert(`ERROR UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.startDate})`);
        } else {
            alert(`UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.startDate})`);
            console.log('update success');
        }
    }

    async sync(addOnClick = false, promptAddGames = false) {

        const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');
        if (!isSignedIn) {
            return;
        }

        let [header, ...items] = this.getScheduleTableRows();

        // First, gather data from all games on page
        let hwrGames = items.map(row => new HWRGame(row));
        let events = await this.getEvents(hwrGames);
        if (events == undefined) {
            return;
        }

        let uncheckedGames = [];
        for (let gameObj of hwrGames) {

            var match = events.find(ev => gameObj.isMatch(ev));
            let cb = gameObj.checkbox;
            let isDisabled = cb.disabled;
            cb.disabled = true;
            if (match) {
                cb.checked = true;
                cb.title = match.id;
                gameObj.CalendarEvent = match;


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

                let isUpdateDesc = match.description != gameObj.getEventDescription();

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


