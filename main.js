
/**
 * content namespace
 * @namespace
 */


function sendMessageToBackground(method, params) {
    return new Promise(function (resolve, reject) {
        chrome.runtime.sendMessage({ method: method, params: params }, function (resp) {
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
async function getEvents() {
    let events = await sendMessageToBackground('calendar.getEvents');
    return events;
}

/**
 * 
 * @param {HWRGame} gameObj 
 */
async function addGame(gameObj) {
    return sendMessageToBackground('calendar.addGame', { game: gameObj });
}

var content = {
    init: function () {
        if (window.location.href.includes("horizonwebref")) {
            var horizonContent = new HorizonContent();
            console.trace("Initializing for horizonwebref");
            sendMessageToBackground('auth.silent').then((token) => {
                horizonContent.addSyncColumn(true, token);
                horizonContent.sync(true);
            }).catch((err) => {
                console.log(err);
                horizonContent.addSyncColumn(false);
            });
        } else if (window.location.href.includes("arbitersports")) {
            console.trace("Initializing for arbitersports");
            chrome.runtime.sendMessage({ method: 'auth.silent' }, function (token) {
                //callback will pass token or null
                if (token) {
                    arbiterContent.addSyncColumn(true, token);
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




