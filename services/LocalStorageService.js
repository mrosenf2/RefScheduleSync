/**
 * This callback is displayed as a global member.
 * @callback addListenerCallback
 * @param {string} newValue
 */

class LocalStorageService {

    /** @returns {Promise<SessionStorage>} SessionStorage */
    static async GetAllStorageSyncData() {
        return this.GetValue(null);
    }

    /**
     * @param {keyof (SessionStorage)} key
     * @param {any} value
     */
    static async SetValue(key, value) {
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.set({ [key]: value }, function () {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }

    /** @param {keyof(SessionStorage)} key */
    static GetValue(key) {
        // Immediately return a promise and start asynchronous work
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.get(key, (items) => {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                // Pass the data retrieved from storage down the promise chain.
                console.log('Storage:', items);
                if (key == null) {
                    resolve(items);
                } else {
                    resolve(items[key]);
                }
            });
        });
    }

    /**
     * @param {keyof(SessionStorage)} key
     * @param {addListenerCallback} callback
     */
    static addListener(key, callback) {
        const newLocal = function (/** @type {{ [s: string]: {oldValue: string, newValue: string} }} */ changes, /** @type {String} */ namespace) {
            for (let [k, { oldValue, newValue }] of Object.entries(changes)) {
                // console.log(
                //     `Storage key "${k}" in namespace "${namespace}" changed.`,
                //     `Old value was "${oldValue}", new value is "${newValue}".`
                // );
                if (namespace == 'local' && key == k) {
                    callback(newValue);
                }
            }
        };
        chrome.storage.onChanged.addListener(newLocal);
    }
}