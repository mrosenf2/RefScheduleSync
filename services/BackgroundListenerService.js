// @ts-nocheck
// let chrome;

function sendMessageToBackground(method, params = null) {
    return new Promise(function (resolve, reject) {
        chrome.runtime.sendMessage({ method: method, params: params }, function (resp) {
            if (!resp || resp == undefined) {
                reject('unkown error');
            }
            if (resp.err) {
                reject(resp.err);
            } else {
                resolve(resp.body);
            }
        });
    });
}

// class CalendarService
/**
 * @returns {Promise<CalEvent[]>}
 */
async function getEvents(minDate, maxDate) {
    return await sendMessageToBackground('calendar.getEvents', { minDate, maxDate });
}

/**
 * @returns {Promise<Calendar[]>}
 */
async function getCalendars() {
    return await sendMessageToBackground('calendar.getCalendars');
}

/**
 * @param {ScheduledGame} gameObj
 */
async function addGame(gameObj) {
    return sendMessageToBackground('calendar.addGame', { game: gameObj });
}

class AuthService {
    static AuthInteractive() {
        return sendMessageToBackground('auth.interactive')
    }

    static AuthSilent() {
        return sendMessageToBackground('auth.interactive');
    }
}