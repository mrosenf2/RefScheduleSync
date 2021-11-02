let content = {
    init: async function () {
        if (window.location.href.includes("horizonwebref")) {
            var horizonContent = new HorizonContent();
            console.log("Initializing for horizonwebref");
            LocalStorageService.SetValue('location', 'Horizon');
            sendMessageToBackground('auth.silent').then((token) => {
                horizonContent.addSyncColumn(true);
                horizonContent.sync(true);
            }).catch((err) => {
                console.log(err);
                horizonContent.addSyncColumn(false);
            });
        } else if (window.location.href.includes("arbitersports")) {
            console.log("Initializing for arbitersports");
            LocalStorageService.SetValue('location', 'Arbiter');
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




