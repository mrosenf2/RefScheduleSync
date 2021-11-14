'use strict';

class HorizonContent {
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
                        console.log('cb.disabled = true', {isSignedIn, isAccepted});
                    }
                    row.cells[0].replaceChildren(cb);
                    let gameObj = new HWRGame(cb, row);

                    stgGames.push(gameObj);
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

            const date1 = new Date(g1.date);
            const date2 = new Date(g2.date);

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
        HorizonContent.onCBClicked(game, this);
    }


    /**
     * 
     * @param {HWRGame} gameObj 
     * @param {HorizonContent} horizonContent 
     */
    static async onCBClicked(gameObj, horizonContent) {
        gameObj.calId = gameObj.checkbox.title; //get new calID because it doesnt update from when event listener is first bound
        if (gameObj.checkbox.checked) {
            //add game to calendar
            gameObj.checkbox.disabled = true;
            let onError = (err) => {
                gameObj.checkbox.checked = false;
                console.log(`error occurred; calendar not updated \n${err}`);
                alert(`error occurred; calendar not updated \n${err}`);
            };
            try {
                let resp = await CalendarService.addGame(gameObj);
                if (!resp.ok) {
                    onError(null);
                }
                gameObj.checkbox.disabled = false;
                gameObj.checkbox.checked = true;
                gameObj.checkbox.title = resp.data.id;
            } catch (err) {
                onError(err);
            }
        } else {
            //remove game to calendar
            let isSuccess = await CalendarService.removeGame(gameObj);
            if (!isSuccess) {
                gameObj.checkbox.checked = true;
                alert("error occurred; calendar not updated");
            }
            horizonContent.sync();
            gameObj.checkbox.disabled = false;
        }
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
                alert(`ERROR UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.date})`);
            } else {
                alert(`UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.date})`);
                console.log('update success');
            }
        }
    }

    async sync(addOnClick = false, isInteractive = false) {

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

                let cb = /** @type {HTMLInputElement} */ (row.cells[0].children[0]);
                hwrGames.push(new HWRGame(cb, row));
            }
        }

        /** @type {CalendarEvent[]} */
        let events;
        if (hwrGames.length == 0) {
            return;
        }
        try {
            let minDate = hwrGames[0].date;
            let maxDate = hwrGames[hwrGames.length - 1].date;
            events = await CalendarService.getEvents(minDate, maxDate);
        } catch (err) {
            const msg = `unable to fetch events from calendar. Try refreshing the page.\n ${err.message}`;
            alert(msg);
            console.log(msg, err);
            this.txtIsSignedIn.innerHTML = "Refresh";
            for (let gameObj of hwrGames) {
                gameObj.checkbox.disabled = true;
            }
            return;
        }

        /**
         * @param {HWRGame} game 
         * @param {string} strName 
         * @returns {boolean}
         */
        function doesNameExist(game, strName) {
            return game.officials.find(s => s.includes(strName)) != undefined;
        }
        // if my name does not appear on the list of officials, leave...        
        if (hwrGames.find(g => !doesNameExist(g, 'Rosenfeld'))) {
            console.log('Sync cancelled because you are viewing a public list');
            alert('Sync cancelled because you are viewing a public list');
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
                cb.addEventListener('click', this.cbClicked.bind(this, gameObj));
            }
            cb.disabled = isDisabled;
        }

        if (isInteractive) {
            if (uncheckedGames.length > 0) {
                let gamesToAdd = uncheckedGames.filter(g => g.isAccepted && !g.isCancelled);
                let result = window.confirm(`add ${gamesToAdd.length} unchecked games?`);
                if (result) {
                    for (let gameObj of gamesToAdd) {
                        await CalendarService.addGame(gameObj);
                    }
                    await this.sync();
                }
            } else {
                alert('no unchecked games to add');
            }
        }
    };

}


