function sendMessageToBackground(method, params) {
    return new Promise(function (resolve, reject) {
        chrome.runtime.sendMessage({ method: method, params: params }, function (resp) {
            if (!resp) {
                reject('unkown error')
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
    return await sendMessageToBackground('calendar.getEvents', {minDate, maxDate});
}

/**
 * @returns {Promise<Calendar[]>}
 */
async function getCalendars() {
    return await sendMessageToBackground('calendar.getCalendars');
}

/** @param {any[]} data */
async function consoleLog(data) {
    console.log('logging', data);
    return await sendMessageToBackground('console.log', { data });
}

async function consoleListen() {
    console.log('listening...')
    while (true) {
        let data = await sendMessageToBackground('console.listen');
        console.log(data);
        if (data)
            console.log('popup', data);
    }
}


/**
 * @param {ScheduledGame} gameObj
 */
async function addGame(gameObj) {
    return sendMessageToBackground('calendar.addGame', { game: gameObj });
}

let content = {
    init: async function () {
        _ = consoleListen()
        if (window.location.href.includes("horizonwebref")) {
            var horizonContent = new HorizonContent();
            console.trace("Initializing for horizonwebref");
            sendMessageToBackground('auth.silent').then((token) => {
                horizonContent.addSyncColumn(true);
                horizonContent.sync(true);
            }).catch((err) => {
                console.log(err);
                horizonContent.addSyncColumn(false);
            });
        } else if (window.location.href.includes("arbitersports")) {
            console.trace("Initializing for arbitersports");
            let arbiterContent = new ArbiterContent();
            chrome.runtime.sendMessage({ method: 'auth.silent' }, function (token) {
                //callback will pass token or null
                if (token) {
                    arbiterContent.addSyncColumn(true);
                    arbiterContent.sync(true);
                } else {
                    arbiterContent.addSyncColumn(false);
                }
            });
        }
    }
};

window.addEventListener('load', function () {
    content.init();
}, false);




