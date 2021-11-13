var API_KEY = 'AIzaSyAzEVzT8vSow_yUZbzjGnlAmhVaaFVR9Og';
console.log('in popup');
console.log(window.location.href);

// When the popup is loaded, fetch the events in this tab from the
// background page, set up the appropriate layout, etc.

const select_onChange = (/** @type {Event} */ evt) => {
    let target = /** @type {HTMLOptionElement} */ (evt.target);
    console.log(target);
    const selectedCalID = target.value;
    LocalStorageService.SetValue('SelectedCalID', selectedCalID);
};

const btnSignIn_click = async (/** @type {Event} */ evt) => {
    try {
        await AuthService.AuthInteractive();
    } catch (error) {
        console.warn(error);
    }
};

const btnSignOut_click = async (/** @type {Event} */ evt) => {
    let result = window.confirm(`Sign out?`);
    if (result) {
        try {
            await AuthService.ClearAllCachedAuthTokens();
        } catch (error) {
            console.error(error);
        }

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


    static async init() {
        try {
            this.selCalendar = /** @type {HTMLSelectElement} */ (document.getElementById('drpdwnCalendars'));
            this.btnSignIn = /** @type {HTMLButtonElement} */ (document.getElementById('authorize_button'));
            this.btnSignOut = /** @type {HTMLButtonElement} */ (document.getElementById('signout_button'));

            const localStorage = await LocalStorageService.GetAllStorageSyncData();
            document.getElementById('title').innerHTML = localStorage.location;

            this.selCalendar.onchange = select_onChange;
            this.btnSignIn.onclick = btnSignIn_click;
            this.btnSignOut.onclick = btnSignOut_click;

            LocalStorageService.addListener('IsAuthenticated', (newValue) => {
                console.log(`Auth changed: ${newValue}`);
                this.adjustSignInButtons(newValue);
            })

            let isSignedIn = await LocalStorageService.GetValue('IsAuthenticated');
            if (isSignedIn == undefined) {
                isSignedIn = await AuthService.IsSignedIn();
                LocalStorageService.SetValue('IsAuthenticated', isSignedIn);
            }
            this.adjustSignInButtons(isSignedIn);

            if (!isSignedIn) {
                return;
            }

            const cals = (await CalendarService.getCalendars()).filter(c => c.accessRole == 'owner');
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
            console.log(error);
        }
    }
}


window.addEventListener('load', function () {
    PopupPage.init();
}, false);
