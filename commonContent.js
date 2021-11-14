class Common {
    /**
     * @param {(addOnClick: boolean, promptAddGames: boolean) => void} syncCallback
     */
    static async SignInSyncHandler(syncCallback) {
        try {
            const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');
            if (isSignedIn) {
                syncCallback(false, true);
            } else {
                AuthService.AuthInteractive().then(() => {
                    syncCallback(false, false);
                }).catch((err) => {
                    console.warn('Auth failed:', err);
                })
            }
        } catch (err) {
            console.error(err);
        }
    }

    static CreateElementSignInSync(isSignedIn) {
        let txtIsSignedIn = document.createElement("p");
        if (isSignedIn) {
            txtIsSignedIn.innerHTML = "Sync";
            txtIsSignedIn.title = "Click to refresh checkboxes";
        } else {
            txtIsSignedIn.innerHTML = "Sign in to Sync";
            txtIsSignedIn.title = "Sign In";
        }
        return txtIsSignedIn;
    }

    /**
     * Adds/Removes game
     * @param {ScheduledGame} gameObj 
     */
    static async onCBClicked(gameObj) {
        gameObj.checkbox.disabled = true;
        gameObj.calId = gameObj.checkbox.title; //get new calID because it doesnt update from when event listener is first bound
        if (gameObj.checkbox.checked) {
            //add game to calendar
            await Common.AddGameToCalendar(gameObj);
        } else {
            //remove game from calendar
            await Common.RemoveGameFromCalendar(gameObj);
        }
        gameObj.checkbox.disabled = false;
    }


    /** @param {ScheduledGame} gameObj */
    static async AddGameToCalendar(gameObj) {
        let onError = (err) => {
            gameObj.checkbox.checked = false;
            console.log(`error occurred; calendar not updated \n${err}`);
            alert(`error occurred; calendar not updated \n${err}`);
        };
        try {
            await gameObj.init();
            let resp = await CalendarService.addGame(gameObj);
            if (resp.ok) {
                gameObj.checkbox.checked = true;
                gameObj.checkbox.title = resp.data.id;
            } else {
                onError(null);
            }
        } catch (err) {
            onError(err);
        }
    }

    /** @param {ScheduledGame} gameObj */
    static async RemoveGameFromCalendar(gameObj) {
        let onError = (err) => {
            gameObj.checkbox.checked = true;
            console.log(`error occurred; calendar not updated \n${err}`);
            alert(`error occurred; calendar not updated \n${err}`);
        };

        try {
            let isSuccess = await CalendarService.removeGame(gameObj);
            if (isSuccess) {
                gameObj.checkbox.checked = false;
                gameObj.checkbox.title = 'n/a';
            } else {
                onError(null);
            }
        } catch (err) {
            onError(err);
        }
    }

    /**
     * @param {ScheduledGame[]} uncheckedGames
     */
    static async AddUncheckedGames(uncheckedGames) {
        if (uncheckedGames.length > 0) {
            let gamesToAdd = uncheckedGames.filter(g => g.isAccepted && !g.isCancelled);
            let result = window.confirm(`add ${gamesToAdd.length} unchecked games?`);
            if (result) {
                for (let gameObj of gamesToAdd) {
                    gameObj.checkbox.disabled = true;
                    await Common.AddGameToCalendar(gameObj);
                    gameObj.checkbox.disabled = false;
                }
            }
        } else {
            alert('no unchecked games to add');
        }
    }
}