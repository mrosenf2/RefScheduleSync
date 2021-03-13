class HorizonContent {
    tbID = "schedResults";
    btnIsSignedIn = "isSignedIn";
    constructor() {

    }


}


var horizonContent = {
    tbID: "schedResults",
    btnIsSignedIn: "isSignedIn",

    getGameObj: function (cb, row) {
        const GAME_ID = 0, DATE = 1, TIME = 2, LEVEL = 3, LOCATION = 6, HOME_TEAM = 4, AWAY_TEAM = 5, PAY = 7, OFFICIALS = 9; GAME_DETAILS = 10;
        let regex = /title:'(?<name>.*)',type:'',text:'(?<detail>.*)'/;
        let officials = [];
        let idxOfficial = 1;
        while (true) {
            try {
                /** @type string */
                let onClick = row.cells[OFFICIALS].children[idxOfficial].attributes["onclick"].value;
                let officialName = regex.exec(onClick).groups.name;
                let officialType = regex.exec(onClick).groups.detail;
                officials.push(`${officialName} (${officialType})`);
                idxOfficial += 3;
            } catch (err) {
                // ignore
                break;
            }
        }

        let regex_location = /showtip\(event, '<center><b><i>(?<location>.*?)<\/b><\/i>/;
        let locationMouseOver = row.cells[LOCATION].children[0].attributes["onmouseover"].value;
        let location_text = regex_location.exec(locationMouseOver).groups.location.replace("-", " ");

        let gameObj = {
            checkbox: cb,
            gameID: row.id,
            date: moment(row.cells[DATE].innerText + " " + row.cells[TIME].innerText, "MM-DD-YYYY h:m a").format(),
            level: row.cells[LEVEL].innerText,
            location: location_text,
            locationURL: row.cells[LOCATION].children[0].href,
            address: row.cells[LOCATION].children[0].href,
            home: row.cells[HOME_TEAM].innerText,
            away: row.cells[AWAY_TEAM].innerText,
            pay: row.cells[PAY].innerText,
            detailsURL: row.cells[GAME_ID].children[0].href,
            officials: officials,
            calId: null,

            async init() {
                return this;
            }
        };

        try {
            console.log(row.cells[GAME_DETAILS]);
            if (row.cells[GAME_DETAILS].innerText.includes("CANCELLED")) {
                gameObj.level = `[CANCELLED] ${gameObj.level}`;
            }
        } catch (error) {
            // ignore
        }


        let eventDescription = JSON.stringify({ Location: gameObj.location, Home: gameObj.home, Away: gameObj.away, Officials: gameObj.officials, Pay: gameObj.pay, GameID: gameObj.gameID, }, null, 2)
            .replace(/[^a-zA-Z0-9\$\. \n:&\(\)\\\/<>]/g, "").slice(0, -1);
        gameObj.eventDescription = eventDescription;

        var locationURLParams = new URLSearchParams(gameObj.locationURL);
        gameObj.address = locationURLParams.get('daddr');


        return gameObj;
    },

    /**
    * Adds column to table. Sends info about games to background listener.
    */
    addSyncColumn: function (isSignedIn) {
        console.trace();
        let tbID = horizonContent.tbID;
        let tblRows = document.getElementById(tbID).children[0].children;
        let totalPay = 0;
        let txtIsSignedIn;
        let stgGames = [];
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
                    txtIsSignedIn.id = horizonContent.btnIsSignedIn;
                    txtIsSignedIn.style = "white-space:nowrap;color:White;cursor:pointer;";
                    txtIsSignedIn.onclick = function () {
                        chrome.runtime.sendMessage({ method: 'auth.interactive' }, function (token) {
                            //callback will have authtoken in response parameter
                            if (token) {
                                horizonContent.sync();
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
                    var gameObj = horizonContent.getGameObj(cb, row);
                    stgGames.push(gameObj);
                    totalPay += Number(gameObj.pay.replace(/[^0-9.-]+/g, ""));
                }
            }
        }
    }
};


horizonContent.cbClicked = function () {
    var gameObj = this;
    gameObj.calId = gameObj.checkbox.title; //get new calID because it doesnt update from when event listener is first bound
    if (gameObj.checkbox.checked) {
        //add game to calendar
        gameObj.checkbox.disabled = true;
        let onError = () => {
            gameObj.checkbox.checked = false;
            alert("error occurred; calendar not updated");
        };
        sendMessageToBackground('calendar.addGame', { game: gameObj })
            .then((isSuccess) => {

                if (!isSuccess) {
                    onError();
                }
                horizonContent.sync();
                gameObj.checkbox.disabled = false;
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

};

horizonContent.sync = function (addOnClick = false) {
    console.trace();

    var tbID = horizonContent.tbID;
    var tblRows = document.getElementById(tbID).children[0].children;

    sendMessageToBackground('calendar.getEvents').then((events) => {
        let isCanceled = false;
        for (let row of tblRows) {
            if (row.id.toLowerCase().includes("assignment")) {
                var cb = row.cells[0].children[0];
                var isDisabled = cb.disabled;
                cb.disabled = true;
                var gameObj = horizonContent.getGameObj(cb, row);
                if (row.cells.length >= 11) {
                    isCanceled = row.cells[10].textContent.search("Canceled") > 0;
                }
                var match = events.find(ev => ev.description.includes(gameObj.gameID.replace("-", "")));
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

                    if (isCanceled) {
                        //remove game to calendar
                        sendMessageToBackground('calendar.removeGame', { game }).then((isSuccess) => {
                            if (!isSuccess) {
                                gameObj.checkbox.checked = true;
                                alert("error occurred; calendar not updated");
                            }
                            horizonContent.sync();
                            gameObj.checkbox.disabled = false;
                        });
                    }

                    let isUpdateDesc = match.description != gameObj.eventDescription;
                    let updateDesc = (gameToUpdate) => {
                        console.log('updating desc of', { gameToUpdate });
                        sendMessageToBackground('calendar.removeGame', { game: gameToUpdate }).then((isSuccess) => {
                            if (!isSuccess) {
                                gameToUpdate.checkbox.checked = true;
                                alert("error occurred; calendar not updated");
                            } else {
                                sendMessageToBackground('calendar.addGame', { game: gameToUpdate })
                                    .then((isSuccess) => {

                                        if (!isSuccess) {
                                            alert(`ERROR UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.date})`);
                                        } else {
                                            alert(`UPDATING DESCRIPTION: \n${gameToUpdate.level} - ${gameToUpdate.location} (${gameToUpdate.date})`);
                                            console.log('update success');
                                        }
                                    });
                            }
                        });
                    };
                    if (isUpdateDesc) {
                        updateDesc(gameObj);
                    }

                } else {
                    cb.checked = false;
                    cb.title = "n/a";
                    gameObj.calId = null;
                }
                if (addOnClick) {
                    cb.addEventListener('click', horizonContent.cbClicked.bind(gameObj));
                }
                cb.disabled = isDisabled;

            }
        }
    }).catch((err) => {
        alert(`unable to fetch events from calendar. Try refreshing the page.\n ${err}`);
        document.getElementById(horizonContent.btnIsSignedIn).innerHTML = "Refresh";
        for (let row of tblRows) {
            if (row.className.toLowerCase().includes("items")) {
                var cb = row.cells[2].children[0];
                cb.disabled = true;
            }
        }
    });
};