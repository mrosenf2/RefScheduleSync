'use strict';

class HorizonContent {
    tbID = "schedResults";
    btnIsSignedIn = "isSignedIn";

    /** 
     * @param {HTMLInputElement} cb 
     * @param {HTMLTableRowElement} row 
     */
    getGameObj(cb, row) {


        let gameObj = new HWRGame(cb, row);
        return gameObj;
    }


    /**
    * Adds column to table. Sends info about games to background listener.
    * @param {boolean} isSignedIn
    */
    addSyncColumn(isSignedIn) {
        console.trace();
        let tblRows = document.getElementById(this.tbID).children[0].children;
        let totalPay = 0;
        let txtIsSignedIn;
        let stgGames = [];
        /** @type {boolean} */
        let isAccepted;
        for (let row of tblRows) {
            if (row.cells) {
                if (!row.id.toLowerCase().includes("assignment")) {
                    row.cells[0].style = "white-space:nowrap;";
                    row.cells[1].style = "white-space:nowrap;";
                    txtIsSignedIn = document.createElement("p");
                    if (isSignedIn) {
                        txtIsSignedIn.innerHTML = "Sync";
                        txtIsSignedIn.title = "Click to refresh checkboxes";
                    } else {
                        txtIsSignedIn.innerHTML = "Sign in to Sync";
                        txtIsSignedIn.title = "Sign In";
                    }
                    txtIsSignedIn.id = this.btnIsSignedIn;
                    txtIsSignedIn.style = "white-space:nowrap;color:White;cursor:pointer;";
                    txtIsSignedIn.onclick = () => {
                        chrome.runtime.sendMessage({ method: 'auth.interactive' }, (token) => {
                            //callback will have authtoken in response parameter
                            if (token) {
                                this.sync(false, isSignedIn);
                            }
                        });
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
                    var gameObj = this.getGameObj(cb, row);
                    stgGames.push(gameObj);
                    totalPay += Number(gameObj.pay.replace(/[^0-9.-]+/g, ""));
                }
            }
        }
    }

    cbClicked(content) {
        HorizonContent.onCBClicked(this, content);
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
            let onError = (err) => {
                gameObj.checkbox.checked = false;
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

    async sync(addOnClick = false, prompAddGames = false) {
        console.trace();

        let tbID = this.tbID;
        let tblRows = document.getElementById(tbID).children[0].children;
        /** @type {CalEvent[]} */
        let events;
        try {
            events = await getEvents();
        } catch (err) {
            alert(`unable to fetch events from calendar. Try refreshing the page.\n ${err}`);
            document.getElementById(this.btnIsSignedIn).innerHTML = "Refresh";
            for (let row of tblRows) {
                if (row.className.toLowerCase().includes("items")) {
                    var cb = row.cells[2].children[0];
                    cb.disabled = true;
                }
            }
            return;
        }

        // First, gather data from all games on page

        /** @type {HWRGame[]} */
        let hwrGames = [];
        for (let row of tblRows) {
            if (row.id.toLowerCase().includes("assignment")) {
                /** @type {HTMLInputElement} */
                let cb = row.cells[0].children[0];
                hwrGames.push(new HWRGame(cb, row));
            }
        }

        let doesNameExist = (game, strName) => game.officials.find(s => s.includes(strName)) != undefined;
        // if my name does not appear on the list of officials, leave...        
        if (hwrGames.includes(g => !doesNameExist(g, 'Rosenfeld'))) {
            alert('Sync cancelled because you are viewing a public list');
            return;
        }

        let uncheckedGames = [];
        for (let gameObj of hwrGames) {

            var match = events.find(ev => ev.description.includes(gameObj.gameID.replace("-", "")));
            let cb = gameObj.checkbox;
            let isDisabled = cb.isDisabled;
            cb.disabled = true;
            if (match) {
                cb.checked = true;
                cb.title = match.id;
                gameObj.calId = match.id;

                // remove duplicates
                // TODO: avoid rate limiting
                let duplicateMatches = events.filter(ev => ev.description.includes(gameObj.gameID.replace("-", "")));
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
                cb.addEventListener('click', this.cbClicked.bind(gameObj, this));
            }
            cb.disabled = isDisabled;
        }

        if (prompAddGames && uncheckedGames.length > 0) {
            let gamesToAdd = uncheckedGames.filter(g => g.isAccepted && !g.isCancelled);
            let result = window.confirm(`add ${gamesToAdd.length} unchecked games?`);
            if (result) {
                for (let gameObj of gamesToAdd) {
                    await addGame(gameObj);
                }
                await this.sync();
            }
        }
    };

}


