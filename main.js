class Content {

    static async setSignInStatus() {
        const isAuth = await AuthService.IsSignedIn();
        const isUserSignedIn = await LocalStorageService.GetValue('IsSignedIn');
        const isSignedIn = isAuth && isUserSignedIn;
        console.log({isAuth, isUserSignedIn});
        console.log("Setting signin status", isSignedIn);
        LocalStorageService.SetValue('IsSignedIn', isSignedIn);
    }

    static async init() {

        /** @type {HorizonContent | ArbiterContent} */
        let scheduler;
        if (window.location.href.includes("horizonwebref")) {
            scheduler = new HorizonContent();
            console.log("Initializing for horizonwebref");
            LocalStorageService.SetValue('SchedulingService', 'Horizon');
        } else if (window.location.href.includes("arbitersports")) {
            scheduler = new ArbiterContent();
            console.log("Initializing for arbitersports");
            LocalStorageService.SetValue('SchedulingService', 'Arbiter');
        }

        const state = await LocalStorageService.GetState();
        console.log({state});

        await Content.setSignInStatus();

        LocalStorageService.addListener('SelectedCalID', (newValue) => {
            console.log(newValue);
        });

        LocalStorageService.addListener('IsSignedIn', async (newValue) => {
            if (!newValue) {
                await AuthService.ClearAllCachedAuthTokens();
            }
            
            await scheduler.addSyncColumn();
            scheduler.sync(true);

            
        });

        try {
            await scheduler.addSyncColumn();
            scheduler.sync(true);
        } catch (err) {
            console.error(err);
        }

    }
};

window.addEventListener('load', function () {
    Content.init();
}, false);




