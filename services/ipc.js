import ParsedGame from "../ParsedGame.js";

/**
 * @param {serviceName} method
 */
const sendMessageToBackground = async (method, params = null) => {
    /** @type {RequestMessage} */
    let message = { method, params };
    return new Promise(function (resolve, reject) {
        chrome.runtime.sendMessage(message, /** @type {myCallback} */ (resp) => {
                if (!resp.ok) {
                    reject(resp.data);
                } else {
                    resolve(resp.data);
                }
            });
    });
};

export class CalendarService {
    /**
     * @param {string} minDate
     * @param {string} maxDate
     * @returns {Promise<CalendarEvent[]>}
     */
    static getEvents(minDate, maxDate) {
        return sendMessageToBackground('calendar.getEvents', { minDate, maxDate });
    }

    /**
     * @returns {Promise<Calendar[]>}
     */
    static getCalendars() {
        return sendMessageToBackground('calendar.getCalendars');
    }

    /**
     * @param {ParsedGame} gameObj
     * @returns {Promise<{ok: boolean, data: CalendarEvent}>}
     */
    static addGame(gameObj) {
        return sendMessageToBackground('calendar.addGame', { game: gameObj });
    }


    /**
     * @param {ParsedGame} gameObj
     * @returns {Promise<{ok: boolean, data: CalendarEvent}>}
     */
    static updateGame(gameObj) {
        return sendMessageToBackground('calendar.updateGame', { game: gameObj });
    }

    /**
     * @param {ParsedGame} gameObj
     * @returns {Promise<boolean>}
     */
    static removeGame(gameObj) {
        return sendMessageToBackground('calendar.removeGame', { game: gameObj });
    }
}

export class AuthService {
    static AuthInteractive() {
        return sendMessageToBackground('auth.interactive');
    }

    static AuthSilent() {
        return sendMessageToBackground('auth.silent');
    }

    static ClearAllCachedAuthTokens() {
        return sendMessageToBackground('auth.clearAllCachedAuthTokens');
    }

    static SwitchLoggedInAccount() {
        return sendMessageToBackground('auth.switchAccount');
    }

    static async IsSignedIn() {
        let isAuth = false;
        try {
            await AuthService.ClearAllCachedAuthTokens();
            const token = await AuthService.AuthSilent();
            isAuth = true;
        } catch (error) {
            console.warn(error);
        }
        return isAuth;
    }
}