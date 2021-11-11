var API_KEY = 'AIzaSyAzEVzT8vSow_yUZbzjGnlAmhVaaFVR9Og';
console.log('in popup');
console.log(window.location.href);
/**
 * When the popup is loaded, fetch the events in this tab from the
 * background page, set up the appropriate layout, etc.
 */

class PopupPage {
    
    static async init() {
        try {
            let select = /** @type {HTMLSelectElement} */ (document.getElementById('drpdwnCalendars'));
            select.onchange = function (evt) {
                let target = /** @type {HTMLOptionElement} */ (evt.target);
                console.log(target);
                const selectedCalID = target.value;
                LocalStorageService.SetValue('SelectedCalID', selectedCalID);
            };

            const localStorage = await LocalStorageService.GetAllStorageSyncData();
            document.getElementById('title').innerHTML = localStorage.location;


            const btnSignIn = /** @type {HTMLButtonElement} */ (document.getElementById('authorize_button'));
            const btnSignOut = /** @type {HTMLButtonElement} */ (document.getElementById('signout_button'));
            const token = await AuthService.AuthSilent();
            btnSignIn.style.display = token ? 'none' : 'initial';
            btnSignOut.style.display = !token ? 'none' : 'initial';

            const cals = (await getCalendars()).filter(c => c.accessRole == 'owner');
            const selectedCalID = await LocalStorageService.GetValue('SelectedCalID');
            let selectedIdx = -1;
            cals.forEach((cal, idx) => {
                var opt = document.createElement('option');
                opt.value = cal.id;
                opt.innerHTML = cal.summary;
                select.appendChild(opt);
                if (cal.id == selectedCalID) {
                    selectedIdx = idx;
                }
            });
            select.selectedIndex = selectedIdx;
        } catch (error) {
            console.log(error);
        }
    }
}


window.addEventListener('load', function () {
    PopupPage.init();
}, false);
