'use strict';

class HorizonContent {
    tbID = "schedResults";
    btnIsSignedIn = "isSignedIn";

    titleText = 'Official Game Schedule';

    /** 
     * @param {HTMLInputElement} cb 
     * @param {HTMLTableRowElement} row 
     */
    getGameObj(cb, row) {
        let gameObj = new HWRGame(cb, row);
        return gameObj;
    }

    isGameSchedulePage() {
        let titleEl = [].slice.call(document.getElementsByTagName('i'))
            .filter((/** @type {{ textContent: string | string[]; }} */ e) => e.textContent.includes(this.titleText));
        return titleEl.length > 0;
    }


    /**
    * Adds column to table. Sends info about games to background listener.
    * @param {boolean} isSignedIn
    */
    addSyncColumn(isSignedIn) {
        if (!this.isGameSchedulePage()) {
            console.log(`Expected title ${this.titleText} not found`);
            return;
        }

        let tblRows = /** @type {HTMLCollectionOf<HTMLTableRowElement>} */
            (document.getElementById(this.tbID).children[0].children);

        let txtIsSignedIn;
        /** @type {HWRGame[]} */
        let stgGames = [];
        /** @type {boolean} */
        let isAccepted;

        for (let row of tblRows) {
            if (row.cells) {
                if (!row.id.toLowerCase().includes("assignment")) {
                    /** @type {CSSStyleDeclaration} */
                    let s;

                    row.cells[0].style.whiteSpace = 'nowrap';
                    row.cells[1].style.whiteSpace = 'nowrap';

                    txtIsSignedIn = document.createElement("p");
                    if (isSignedIn) {
                        txtIsSignedIn.innerHTML = "Sync";
                        txtIsSignedIn.title = "Click to refresh checkboxes";
                    } else {
                        txtIsSignedIn.innerHTML = "Sign in to Sync";
                        txtIsSignedIn.title = "Sign In";
                    }
                    txtIsSignedIn.id = this.btnIsSignedIn;
                    txtIsSignedIn.style.whiteSpace = 'nowrap';
                    txtIsSignedIn.style.color = 'White';
                    txtIsSignedIn.style.fontStyle = 'bold';
                    txtIsSignedIn.style.cursor = 'pointer';

                    txtIsSignedIn.onclick = async () => {
                        try {
                            const token = await AuthService.AuthInteractive();
                            if (token) {
                                this.sync(false, isSignedIn);
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    };
                    row.cells[0].append(txtIsSignedIn);
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
                        console.trace('cb.disabled = true');
                    }
                    row.cells[0].replaceChildren(cb);
                    let gameObj = this.getGameObj(cb, row);

                    stgGames.push(gameObj);
                }
            }
        }
        for (let i = 0; i < stgGames.length - 1; i++) {
            const g1 = stgGames[i];
            const g2 = stgGames[i + 1];
            if (checkTimeBetweenGames(g1, g2)) {
                g2.row.style.background = "orange";
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
    static onCBClicked(gameObj, horizonContent) {
        gameObj.calId = gameObj.checkbox.title; //get new calID because it doesnt update from when event listener is first bound
        if (gameObj.checkbox.checked) {
            //add game to calendar
            gameObj.checkbox.disabled = true;
            let onError = (/** @type {any} */ err) => {
                gameObj.checkbox.checked = false;
                console.log(`error occurred; calendar not updated \n${err}`);
                alert(`error occurred; calendar not updated \n${err}`);
            };
            addGame(gameObj).then((isSuccess) => {

                if (!isSuccess) {
                    onError(null);
                }
                horizonContent.sync();
                gameObj.checkbox.disabled = false;
            }).catch(err => {
                onError(err);
            });
        } else {
            //remove game to calendar
            sendMessageToBackground('calendar.removeGame', { game: gameObj }).then((isSuccess) => {
                if (!isSuccess) {
                    gameObj.checkbox.checked = true;
                    alert("error occurred; calendar not updated");
                }
                horizonContent.sync();
                gameObj.checkbox.disabled = false;
            });
        }
    }


    /**
     * 
     * @param {HWRGame} gameToUpdate 
     */
    updateDesc(gameToUpdate) {
        console.log('updating desc of', { gameToUpdate });
        sendMessageToBackground('calendar.removeGame', { game: gameToUpdate }).then((isSuccess) => {
            if (!isSuccess) {
                gameToUpdate.checkbox.checked = true;
                alert("error occurred; calendar not updated");
            } else {
                addGame(gameToUpdate).then((isSuccess) => {

                    if (!isSuccess) {
                        alert(`ERROR UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.date})`);
                    } else {
                        alert(`UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.date})`);
                        console.log('update success');
                    }
                });
            }
        });
    }

    async sync(addOnClick = false, isInteractive = false) {
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

        /** @type {CalEvent[]} */
        let events;
        if (hwrGames.length == 0) {
            return;
        }
        try {
            let minDate = hwrGames[0].date;
            let maxDate = hwrGames[hwrGames.length - 1].date;
            events = await getEvents(minDate, maxDate);
        } catch (err) {
            const msg = `unable to fetch events from calendar. Try refreshing the page.\n ${err}`;
            alert(msg);
            console.log(msg);
            document.getElementById(this.btnIsSignedIn).innerHTML = "Refresh";
            for (let gameObj of hwrGames) {
                gameObj.checkbox.disabled = true;
            }
            return;
        }

        let doesNameExist = (/** @type { HWRGame } */ game, /** @type {string} */ strName) => game.officials.find(s => s.includes(strName)) != undefined;
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
                    sendMessageToBackground('calendar.removeGame', { game: gameObj }).then((isSuccess) => {
                        if (!isSuccess) {
                            alert("error occurred; calendar not updated");
                        } else {
                            console.log('removed duplicate');
                        }
                    });
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
                        await addGame(gameObj);
                    }
                    await this.sync();
                }
            } else {
                alert('no unchecked games to add');
            }
        }
    };

}


