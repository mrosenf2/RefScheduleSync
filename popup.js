var API_KEY = 'AIzaSyAzEVzT8vSow_yUZbzjGnlAmhVaaFVR9Og';
console.log('in popup')
/**
 * When the popup is loaded, fetch the events in this tab from the
 * background page, set up the appropriate layout, etc.
 */


let log = async (...data) => {
    try {
        await consoleLog('popup:', ...data);
    } catch (error) {
        console.warn('error logging', data, error);
    }
}

let popupContent = {
    
    init: async function () {

        log('works')
        try {
            /** @type {HTMLSelectElement} */
            let select = document.getElementById('drpdwnCalendars');
            select.onchange = function (evt) { 
                console.log(evt.target.value);
            };


            const token = await sendMessageToBackground('auth.silent');
            const cals = (await getCalendars()).filter(c => c.accessRole == 'owner');
            cals.forEach(cal => {
                var opt = document.createElement('option');
                opt.value = cal.id;
                opt.innerHTML = cal.summary;
                select.appendChild(opt);
            });
        } catch (error) {
            console.log(err);
        }
    }
};


window.addEventListener('load', function () {
    popupContent.init();
}, false);
