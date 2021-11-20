import BGCalendarService from "./background_scripts/CalendarService.js";
import LocalStorageService from "./services/LocalStorageService.js";
import { AuthService, CalendarService } from "./services/ipc.js";

console.log('in settings');
console.log(window.location.href);

// When the popup is loaded, fetch the events in this tab from the
// background page, set up the appropriate layout, etc.


const btnSave_click = async () => {
    LocalStorageService.SetValue('SelectedCalendar', { id: SettingsPage.selectedCalendar.id, title: SettingsPage.selectedCalendar.summary });
    let curTab = await chrome.tabs.getCurrent();
    chrome.tabs.remove(curTab.id);
};

const btnCancel_click = async () => {
    let result = window.confirm(`Close without saving?`);
    if (result) {
        let curTab = await chrome.tabs.getCurrent();
        chrome.tabs.remove(curTab.id);
    }
};

const timezones = [
    "Same as system",
    "US/Eastern",
    "US/Central",
    "US/Mountain",
    "US/Pacific"
]


class SettingsPage {

    /** @type {HTMLButtonElement} */
    static btnCancel;

    /** @type {HTMLButtonElement} */
    static btnSave;

    /** @type {HTMLSelectElement} */
    static selCalendar;

    /** @type {Calendar} */
    static selectedCalendar;

    /** @type {Calendar[]} */
    static UserCalendars;

    

    static async setUserSignedIn() {
        try {
            let calService = await BGCalendarService.GetInstance();
            SettingsPage.UserCalendars = (await calService.getCalendars()).filter(c => c.accessRole == 'owner');
            SettingsPage.selectedCalendar = await LocalStorageService.GetValue('SelectedCalendar');
            this.selCalendar.selectedIndex = -1;
            SettingsPage.UserCalendars.forEach((cal, idx) => {
                var opt = document.createElement('option');
                opt.value = cal.id;
                opt.innerText = cal.summary;
                this.selCalendar.appendChild(opt);
                if (cal.id == SettingsPage.selectedCalendar?.id) {
                    this.selCalendar.selectedIndex = idx;
                }
            });

            timezones.forEach((tz, idx) => {
                var opt = document.createElement('option');
                opt.value = tz
                opt.innerText = tz
                this.selTimezone.appendChild(opt);

                if (tz != timezones[0]) {
                    if (new Date().toLocaleString("en-US", { timeZone: tz }) == new Date().toLocaleString()) {
                        this.selTimezone.selectedIndex = idx;
                    }
                }
                
            })

        } catch (error) {
            console.warn(error);
        }
    }


    static async init() {
        try {
            this.selCalendar = /** @type {HTMLSelectElement} */ (document.getElementById('selCalendar'));
            this.selTimezone = /** @type {HTMLSelectElement} */ (document.getElementById('selTimezone'));
            this.btnSave = /** @type {HTMLButtonElement} */ (document.getElementById('btnSave'));
            this.btnCancel = /** @type {HTMLButtonElement} */ (document.getElementById('btnCancel'));
            


            this.selCalendar.onchange = (evt) => {
                let target = /** @type {HTMLOptionElement} */ (evt.target);
                console.log(target);
                const selectedCalID = target.value;
                const calendar = SettingsPage.UserCalendars.find(c => c.id === selectedCalID);
                SettingsPage.selectedCalendar = calendar;
            };

            this.btnSave.onclick = btnSave_click;
            this.btnCancel.onclick = btnCancel_click;

            SettingsPage.setUserSignedIn()

        } catch (error) {
            console.log(error);
        }
    }
}


window.addEventListener('load', function () {
    SettingsPage.init();
}, false);
