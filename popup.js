var API_KEY = 'AIzaSyAzEVzT8vSow_yUZbzjGnlAmhVaaFVR9Og';
console.log('in popup');
console.log(window.location.href);

import BGCalendarService from "./background_scripts/CalendarService.js";
import LocalStorageService from "./services/LocalStorageService.js";
import { AuthService, CalendarService } from "./services/ipc.js";

// When the popup is loaded, fetch the events in this tab from the
// background page, set up the appropriate layout, etc.


const btnSignIn_click = async () => {
    try {
        await AuthService.AuthInteractive();
    } catch (error) {
        console.warn(error);
    }
};

const btnSignOut_click = async () => {
    let result = window.confirm(`Sign out?`);
    if (result) {
        LocalStorageService.SetValue('IsSignedIn', false);
    }
};

class PopupPage {

    /** @type {HTMLButtonElement} */
    static btnSignIn;

    /** @type {HTMLButtonElement} */
    static btnSignOut;

    /** @type {HTMLSelectElement} */
    static selCalendar;

    /**
     * @param {boolean} isSignedIn
     */
    static adjustSignInButtons(isSignedIn) {
        this.btnSignIn.hidden = isSignedIn;
        this.btnSignOut.hidden = !isSignedIn;
        this.selCalendar.hidden = !isSignedIn;
    }

    static async setUserSignedIn() {
        try {
            let calService = await BGCalendarService.GetInstance();
            const cals = (await calService.getCalendars()).filter(c => c.accessRole == 'owner');
            const selectedCalID = await LocalStorageService.GetValue('SelectedCalID');
            let selectedIdx = -1;
            cals.forEach((cal, idx) => {
                var opt = document.createElement('option');
                opt.value = cal.id;
                opt.innerHTML = cal.summary;
                this.selCalendar.appendChild(opt);
                if (cal.id == selectedCalID) {
                    selectedIdx = idx;
                }
            });
            this.selCalendar.selectedIndex = selectedIdx;
        } catch (error) {
            console.warn(error);
        }
        this.adjustSignInButtons(true);
    }

    static async setUserSignedOut() {
        this.adjustSignInButtons(false);
    }

    static onUserSignInStatusChange(isSignedIn) {
        if (isSignedIn) {
            this.setUserSignedIn();
        } else {
            this.setUserSignedOut();
        }
    }

    static setStatusMessage(msg) {
        document.getElementById('status_message').innerHTML = msg;
    }


    static async init() {
        try {
            this.selCalendar = /** @type {HTMLSelectElement} */ (document.getElementById('drpdwnCalendars'));
            this.btnSignIn = /** @type {HTMLButtonElement} */ (document.getElementById('authorize_button'));
            this.btnSignOut = /** @type {HTMLButtonElement} */ (document.getElementById('signout_button'));

            document.getElementById('title').innerHTML = await LocalStorageService.GetValue('SchedulingService');
            document.getElementById('status_message').innerHTML = await LocalStorageService.GetValue('StatusMessage');

            this.selCalendar.onchange = (evt) => {
                let target = /** @type {HTMLOptionElement} */ (evt.target);
                console.log(target);
                const selectedCalID = target.value;
                LocalStorageService.SetValue('SelectedCalID', selectedCalID);
            }

            this.btnSignIn.onclick = btnSignIn_click;
            this.btnSignOut.onclick = btnSignOut_click;

            LocalStorageService.addListener('IsSignedIn', (newValue) => {
                console.log(`Auth changed: ${newValue}`);
                this.onUserSignInStatusChange(newValue);
            })

            LocalStorageService.addListener('StatusMessage', (newValue) => {
                document.getElementById('status_message').innerHTML = newValue;
            })

            let isSignedIn = await LocalStorageService.GetValue('IsSignedIn');
            this.onUserSignInStatusChange(isSignedIn);
            
        } catch (error) {
            console.log(error);
        }
    }
}


window.addEventListener('load', function () {
    PopupPage.init();
}, false);
