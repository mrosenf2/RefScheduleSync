let content = {
    init: async function () {

        /** @type {HorizonContent | ArbiterContent} */
        let scheduler;
        if (window.location.href.includes("horizonwebref")) {
            scheduler = new HorizonContent();
            console.log("Initializing for horizonwebref");
            LocalStorageService.SetValue('location', 'Horizon');
        } else if (window.location.href.includes("arbitersports")) {
            scheduler = new ArbiterContent();
            console.log("Initializing for arbitersports");
            LocalStorageService.SetValue('location', 'Arbiter');
        }

        LocalStorageService.addListener('SelectedCalID', (newValue) => {
            console.log(newValue);
        })

        LocalStorageService.addListener('IsAuthenticated', (newValue) => {
            console.log(newValue);
        })

        try {
            await scheduler.addSyncColumn();
            scheduler.sync(true);
        } catch (err) {
            console.error(err);
        }
    }
};

window.addEventListener('load', function () {
    content.init();
}, false);




