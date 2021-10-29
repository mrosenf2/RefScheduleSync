class ArbiterContent {

    btnIsSignedIn = "isSignedIn";
    tbID = "ctl00_ContentHolder_pgeGameScheduleEdit_conGameScheduleEdit_dgGames";

    /**
     * Adds column to table. Sends info about games to background listener.
     */
    addSyncColumn(isSignedIn, authtoken) {
        let tbID = this.tbID;
        let tblRows = document.getElementById(tbID).children[0].children;
        let totalPay = 0;
        let txtIsSignedIn;
        let stgGames = [];
        let isAccepted;
        for (let row of tblRows) {
            row.insertCell(2);
            if (row.className.toLowerCase().includes("headers")) {
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
                txtIsSignedIn.style = "white-space: nowrap; color: White; cursor: pointer;";
                txtIsSignedIn.onclick = () => {
                    chrome.runtime.sendMessage({ method: 'auth.interactive' }, (token) => {
                        //callback will have authtoken in response parameter
                        if (token) {
                            this.sync(false, isSignedIn);
                        }
                    });
                };
                row.cells[2].append(txtIsSignedIn);
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
                row.cells[2].append(cb);
                let gameObj = this.getGameObj(cb, row);
                stgGames.push(gameObj);
                totalPay += Number(gameObj.pay.replace(/[^0-9.-]+/g, ""));
            }
        }
        let el = document.createElement("p");
        el.innerText = "Total: " + totalPay.toString();
        document.getElementById(tbID).appendChild(el);

    };

    cbClicked(content) {
        ArbiterContent.onCbClicked(this, content);
    }


    /**
     *
     * @param {ARBGame} gameObj
     * @param {ArbiterContent} arbiterContent
     */
    static async onCbClicked(gameObj, arbiterContent) {
        gameObj.calId = gameObj.checkbox.title; //get new calID because it doesnt update from when event listener is first bound
        if (gameObj.checkbox.checked) {
            //add game to calendar
            gameObj.checkbox.disabled = true;
            await gameObj.init();
            let onError = (err) => {
                gameObj.checkbox.checked = false;
                alert(`error occurred; calendar not updated \n${err}`);
            };
            addGame(gameObj).then((isSuccess) => {

                if (!isSuccess) {
                    onError(null);
                }
                arbiterContent.sync();
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
                arbiterContent.sync();
                gameObj.checkbox.disabled = false;
            });
        }

    };




    getGameObj(cb, row) {
        return new ARBGame(cb, row);
    };



    async sync(addOnClick = false, prompAddGames = false) {
        let tbID = this.tbID;
        let tblRows = document.getElementById(tbID).children[0].children;



        // First, gather data from all games on page

        /** @type {ARBGame[]} */
        let arbGames = [];
        for (let row of tblRows) {
            if (row.className.toLowerCase().includes("items")) {
                /** @type {HTMLInputElement} */
                let cb = row.cells[2].children[0];
                cb.disabled = true;
                let game = new ARBGame(cb, row);
                arbGames.push(game);
            }
        }

        /** @type {CalEvent[]} */
        let events;
        try {
            let minDate = arbGames[0].date;
            let maxDate = arbGames[arbGames.length - 1].date;
            events = await getEvents(minDate, maxDate);
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
                    sendMessageToBackground('calendar.removeGame', { game: gameObj }, (isSuccess) => {
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
                cb.addEventListener('click', this.cbClicked.bind(gameObj, this));
            }
            cb.disabled = false;
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

    // export default arbiterContent;
}