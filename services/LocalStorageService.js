/**
 * This callback is displayed as a global member.
 * @callback addListenerCallback
 * @param {any} newValue
 */

export default class LocalStorageService {

    /** @returns {Promise<SessionStorage>} SessionStorage */
    static async GetAllStorageSyncData() {
        return this.GetState();
    }

    /**
     * @template {keyof (SessionStorage)} K
     * @param {K} key
     * @param {SessionStorage[K]} value
     */
    static async SetValue(key, value) {
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.set({ [key]: value }, function () {
                // Pass any observed errors down the promise chain.
                console.trace(`set ${key} to`, {value});
                if (chrome.runtime.lastError) {
                    console.warn(chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }

    /**
     * @param {SessionStorage} state
     */
    static async SetState(state) {
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.set(state, function () {
                console.trace('set state to', { state });
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    console.warn(chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                }
                resolve();
            });
        });
    }


    /**
     * @template {keyof (SessionStorage)} K
     * @param {K} key
     * @returns {Promise<SessionStorage[K]> }
     */
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
                // console.log('Storage:', items);
                resolve(items[key]);
            });
        });
    }

    /**
     * @returns {Promise<SessionStorage>}
     */
    static GetState() {
        return new Promise((resolve, reject) => {
            // Asynchronously fetch all data from storage.sync.
            chrome.storage.local.get(null, (items) => {
                // Pass any observed errors down the promise chain.
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                // Pass the data retrieved from storage down the promise chain.
                console.log('Storage:', items);
                // @ts-ignore
                resolve(items);
            });
        });
    }

    /**
     * @template {keyof (SessionStorage)} K
     * @param {K} key
     * @param {(newValue: SessionStorage[K]) => void} callback
     */
    static addListener(key, callback) {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            for (let [k, v] of Object.entries(changes)) {
                let newValue = v.newValue;
                if (namespace == 'local' && key == k && v.newValue != v.oldValue) {
                    callback(newValue);
                }
            }
        });
    }
}