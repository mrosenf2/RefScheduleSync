import { AuthService, CalendarService } from "./services/ipc.js";
import LocalStorageService from "./services/LocalStorageService.js";
import ScheduledGame from "./ScheduledGame.js";

export default class Common {

    btnIsSignedIn = "isSignedIn";
    
    /** @type {HTMLParagraphElement} */ txtIsSignedIn;

    async SignInSyncHandler() {
        try {
            const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');
            if (isSignedIn) {
                this.sync(false, true);
            } else {
                AuthService.AuthInteractive().then(() => {
                    this.sync(false, false);
                }).catch((err) => {
                    console.warn('Auth failed:', err);
                })
            }
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * @abstract
     * @param {boolean} [_addOnClick]
     * @param {boolean} [_promptAddGames]
     */
    sync(_addOnClick, _promptAddGames) {
        throw 'not implemented'
    }

    /**
     * get calendar events in date range specified by given list of parsed games
     * @param {ScheduledGame[]} lstGames
     */
    async getEvents(lstGames) {
        let minDate = lstGames[0].startDate;
        let maxDate = lstGames[lstGames.length - 1].startDate;
        let events = await CalendarService.getEvents(minDate.toISOString(), maxDate.toISOString());
        return events;
    }

    /**
     * @param {boolean} isSignedIn
     */
    CreateElementSignInSync(isSignedIn) {
        let txtIsSignedIn = document.createElement("p");
        if (isSignedIn) {
            txtIsSignedIn.innerText = "Sync";
            txtIsSignedIn.title = "Click to refresh checkboxes";
        } else {
            txtIsSignedIn.innerText = "Sign in to Sync";
            txtIsSignedIn.title = "Sign In";
        }

        txtIsSignedIn.id = this.btnIsSignedIn;
        
        txtIsSignedIn.onclick = () => {
            this.SignInSyncHandler();
        };

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
            await Common.AddGameToCalendar(gameObj);
        } else {
            await Common.RemoveGameFromCalendar(gameObj);
        }
        gameObj.checkbox.disabled = false;
    }


    /** @param {ScheduledGame} gameObj */
    static async AddGameToCalendar(gameObj) {
        let onError = (/** @type {CalendarEvent} */ err) => {
            gameObj.checkbox.checked = false;
            console.warn('error occurred; calendar not updated', {err});
            alert(`error occurred; calendar not updated \n${err}`);
        };
        try {
            await gameObj.init();
            let resp = await CalendarService.addGame(gameObj);
            if (resp.ok) {
                gameObj.checkbox.checked = true;
                gameObj.checkbox.title = resp.data.id;
            } else {
                onError(resp.data);
            }
        } catch (err) {
            onError(err);
        }
    }

    /** @param {ScheduledGame} gameObj */
    static async RemoveGameFromCalendar(gameObj) {
        let onError = (/** @type {any} */ err) => {
            gameObj.checkbox.checked = true;
            console.warn('error occurred; calendar not updated', { err });
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