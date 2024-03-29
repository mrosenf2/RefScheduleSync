import ArbiterContent from "./arbiterContent.js";
import HorizonContent from "./horizonContent.js";
import { AuthService } from "./services/ipc.js";
import LocalStorageService from "./services/LocalStorageService.js";

export default class Content {

    static async setSignInStatus() {
        const isAuth = await AuthService.IsSignedIn();
        const isUserSignedIn = await LocalStorageService.GetValue('IsSignedIn');
        const isSignedIn = isAuth && isUserSignedIn;
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
        
        await Content.setSignInStatus();

        LocalStorageService.addListener('SelectedCalendar', async (newValue) => {
            console.log({newValue});
            const isSignedIn = await LocalStorageService.GetValue('IsSignedIn');
            if (isSignedIn) alert('Selected Calendar change. Please refresh the page to sync.');
        });

        LocalStorageService.addListener('IsSignedIn', async (newValue) => {
            if (!newValue) {
                console.log('signing out');
                await AuthService.ClearAllCachedAuthTokens();
                await LocalStorageService.ClearState();
            }
            
            await scheduler.addSyncColumn();
            scheduler.sync(true);

            
        });

        try {
            if (!scheduler.isGameSchedulePage()) {
                return;
            }
            await scheduler.addSyncColumn();
            scheduler.sync(true);
        } catch (err) {
            console.error(err);
        }

    }
};

// window.addEventListener('load', function () {
//     Content.init();
// }, false);




