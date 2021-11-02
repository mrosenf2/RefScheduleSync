var API_KEY = 'AIzaSyAzEVzT8vSow_yUZbzjGnlAmhVaaFVR9Og';
console.log('in popup')
console.log(window.location.href)
/**
 * When the popup is loaded, fetch the events in this tab from the
 * background page, set up the appropriate layout, etc.
 */

let popupContent = {
    
    init: async function () {
        try {
            /** @type {HTMLSelectElement} */
            let select = document.getElementById('drpdwnCalendars');
            select.onchange = function (evt) { 
                console.log(evt.target.value);
            };

            const localStorage = await LocalStorageService.GetAllStorageSyncData();
            document.getElementById('title').innerHTML = localStorage.location;


            const token = await sendMessageToBackground('auth.silent');
            const cals = (await getCalendars()).filter(c => c.accessRole == 'owner');
            cals.forEach(cal => {
                var opt = document.createElement('option');
                opt.value = cal.id;
                opt.innerHTML = cal.summary;
                select.appendChild(opt);
            });
        } catch (error) {
            console.log(error);
        }
    }
};


window.addEventListener('load', function () {
    popupContent.init();
}, false);
