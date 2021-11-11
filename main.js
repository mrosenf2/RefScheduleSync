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

        try {
            const token = await AuthService.AuthSilent();
            scheduler.addSyncColumn(true);
            scheduler.sync(true);
        } catch (err) {
            console.log(err);
            scheduler.addSyncColumn(false);
        }
    }
};

window.addEventListener('load', function () {
    content.init();
}, false);




