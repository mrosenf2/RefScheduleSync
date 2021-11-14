class ArbiterContent {

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

        for (let row of tblRows) {
            row.insertCell(2);
            if (row.className.toLowerCase().includes("headers")) {
                let txtIsSignedIn = Common.CreateElementSignInSync(isSignedIn);
                txtIsSignedIn.id = this.btnIsSignedIn;
                txtIsSignedIn.onclick = () => {
                    Common.SignInSyncHandler(this.sync.bind(this))
                };
                row.cells[2].replaceChildren(txtIsSignedIn);
            }
            if (row.className.toLowerCase().includes("items")) {
                //create sync checkbox
                let cb = document.createElement("input");
                cb.type = "checkbox";

                /** @type {Boolean} */
                let isAccepted;
                if (row.cells.length >= 11) {
                    isAccepted = row.cells[10].textContent.search("Accepted") > 0;
                }

                if (!isSignedIn || !isAccepted) {
                    cb.disabled = true;
                    console.trace('cb.disabled = true');
                }
                row.cells[2].replaceChildren(cb);
                let gameObj = new ARBGame(cb, row);
                stgGames.push(gameObj);
                totalPay += Number(gameObj.pay.replace(/[^0-9.-]+/g, ""));
            }
        }
        let el = document.createElement("p");
        el.innerText = "Total: " + totalPay.toString();
        document.getElementById(tbID).appendChild(el);

    };

    /**
     * @param {ARBGame} game
     */
    cbClicked(game) {
        ArbiterContent.onCbClicked(game, this);
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
            CalendarService.addGame(gameObj).then((isSuccess) => {

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
            CalendarService.removeGame(gameObj).then((isSuccess) => {
                if (!isSuccess) {
                    gameObj.checkbox.checked = true;
                    alert("error occurred; calendar not updated");
                }
                arbiterContent.sync();
                gameObj.checkbox.disabled = false;
            });
        }

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

                let cb = /** @type {HTMLInputElement} */ (row.cells[2].children[0]);
                cb.disabled = true;
                let game = new ARBGame(cb, row);
                arbGames.push(game);
            }
        }

        /** @type {CalendarEvent[]} */
        let events;
        try {
            let minDate = arbGames[0].date;
            let maxDate = arbGames[arbGames.length - 1].date;
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
                cb.addEventListener('click', this.cbClicked.bind(this, gameObj));
            }
            cb.disabled = false;
        }

        if (prompAddGames && uncheckedGames.length > 0) {
            let gamesToAdd = uncheckedGames.filter(g => g.isAccepted && !g.isCancelled);
            let result = window.confirm(`add ${gamesToAdd.length} unchecked games?`);
            if (result) {
                for (let gameObj of gamesToAdd) {
                    await CalendarService.addGame(gameObj);
                }
                await this.sync();
            }
        }
    };

    // export default arbiterContent;
}
