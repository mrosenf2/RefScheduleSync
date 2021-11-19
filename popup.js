import BGCalendarService from "./background_scripts/CalendarService.js";
import LocalStorageService from "./services/LocalStorageService.js";
import { AuthService, CalendarService } from "./services/ipc.js";

console.log('in popup');
console.log(window.location.href);

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


const btnSettings_click = async () => {
    document.getElementById('settings_container').hidden = !document.getElementById('settings_container').hidden;
};

class PopupPage {

    /** @type {HTMLButtonElement} */
    static btnSignIn;

    /** @type {HTMLButtonElement} */
    static btnSignOut;

    /** @type {HTMLSelectElement} */
    static selCalendar;

    /** @type {Calendar[]} */
    static UserCalendars;

    /**
     * @param {boolean} isSignedIn
     */
    static adjustSignInButtons(isSignedIn) {
        this.btnSignIn.hidden = isSignedIn;
        this.btnSignOut.hidden = !isSignedIn;
        this.btnSettings.hidden = !isSignedIn;
        this.dvStatus.hidden = !isSignedIn;
    }

    static async setUserSignedIn() {
        try {
            let calService = await BGCalendarService.GetInstance();
            PopupPage.UserCalendars = (await calService.getCalendars()).filter(c => c.accessRole == 'owner');
            const selectedCal = await LocalStorageService.GetValue('SelectedCalendar');
            let selectedIdx = -1;
            PopupPage.UserCalendars.forEach((cal, idx) => {
                var opt = document.createElement('option');
                opt.value = cal.id;
                opt.innerHTML = cal.summary;
                this.selCalendar.appendChild(opt);
                if (cal.id == selectedCal?.id) {
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
        document.getElementById('status_message').innerText = msg;
    }


    static async init() {
        try {
            this.selCalendar = /** @type {HTMLSelectElement} */ (document.getElementById('drpdwnCalendars'));
            this.btnSignIn = /** @type {HTMLButtonElement} */ (document.getElementById('authorize_button'));
            this.btnSignOut = /** @type {HTMLButtonElement} */ (document.getElementById('signout_button'));
            this.btnSettings = /** @type {HTMLButtonElement} */ (document.getElementById('settings_button'));
            this.dvSettings = /** @type {HTMLDivElement} */ document.getElementById('settings_container');
            this.dvStatus = /** @type {HTMLDivElement} */ document.getElementById('status_container');

            document.getElementById('title').innerHTML = await LocalStorageService.GetValue('SchedulingService');
            

            this.selCalendar.onchange = (evt) => {
                let target = /** @type {HTMLOptionElement} */ (evt.target);
                console.log(target);
                const selectedCalID = target.value;
                const selectedCalendar = PopupPage.UserCalendars.find(c => c.id === selectedCalID);
                LocalStorageService.SetValue('SelectedCalendar', {id: selectedCalendar.id, title: selectedCalendar.summary});
            }

            this.btnSignIn.onclick = btnSignIn_click;
            this.btnSignOut.onclick = btnSignOut_click;
            this.btnSettings.onclick = btnSettings_click;

            LocalStorageService.addListener('IsSignedIn', (newValue) => {
                console.log(`Auth changed: ${newValue}`);
                this.onUserSignInStatusChange(newValue);
            })

            LocalStorageService.addListener('StatusMessage', (newValue) => {
                this.setStatusMessage(newValue);
            })
            this.setStatusMessage(await LocalStorageService.GetValue('StatusMessage'));

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
