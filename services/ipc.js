/**
 * @param {serviceName} method
 */
const sendMessageToBackground = (method, params = null) => {
    /** @type {RequestMessage} */
    let message = { method, params };
    return new Promise(function (resolve, reject) {
        chrome.runtime.sendMessage(message, /** @type {myCallback} */ function (resp) {
            if (!resp.ok) {
                reject(resp.data);
            } else {
                resolve(resp.data);
            }
        });
    });
}

class CalendarService {
    /**
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
     * @param {ScheduledGame} gameObj
     * @returns {Promise<{ok: boolean, data: CalendarEvent}>}
     */
    static addGame(gameObj) {
        return sendMessageToBackground('calendar.addGame', { game: gameObj });
    }

    /**
     * @param {ScheduledGame} gameObj
     */
    static removeGame(gameObj) {
        return sendMessageToBackground('calendar.removeGame', { game: gameObj });
    }
}

class AuthService {
    static AuthInteractive() {
        return sendMessageToBackground('auth.interactive');
    }

    static AuthSilent() {
        return sendMessageToBackground('auth.silent');
    }

    static ClearAllCachedAuthTokens() {
        return sendMessageToBackground('auth.clearAllCachedAuthTokens');
    }

    static async IsSignedIn() {
        await AuthService.ClearAllCachedAuthTokens();
        try {
            const token = await AuthService.AuthSilent();
            if (token) {
                LocalStorageService.SetValue('IsAuthenticated', true);
                return true;
            }
        } catch (error) {
            console.log(error);
        }
        LocalStorageService.SetValue('IsAuthenticated', false);
        return false;
    }
}