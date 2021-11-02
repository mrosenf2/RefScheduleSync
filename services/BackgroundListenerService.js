class LocalStorageService {

    /** @returns {SessionStorage} SessionStorage */
    static async GetAllStorageSyncData() {
        return this.GetValue(null);
    }

    /** @param {keyof(SessionStorage)} key */
    static async SetValue(key, value) {
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.set({ [key]: value }, function () {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }

    /** @param {keyof(SessionStorage)} key */
    static GetValue(key) {
        // Immediately return a promise and start asynchronous work
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.get(key, (items) => {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                // Pass the data retrieved from storage down the promise chain.
                console.log('Storage:', items);
                if (key == null) {
                    resolve(items);
                } else {
                    resolve(items[key]);
                }
            });
        });
    }
}

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