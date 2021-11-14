/**
 * @callback myCallback
 * @param {{ok: boolean, data?: any, err?: any}} resp
 */

/**
 * @typedef {{ method: serviceName; params: any; }} RequestMessage
 */

/**
 * @typedef { ""
 * | "auth.interactive" 
 * | "auth.silent" 
 * | "auth.clearAllCachedAuthTokens"
 * | "auth.switchAccount"
 * | "calendar.getCalendars"
 * | "calendar.getEvents"
 * | "calendar.addGame"
 * | "calendar.removeGame"
 * } serviceName
 */


let background = {

  listenForRequests_: function () {

    let listen = async (/** @type {RequestMessage} */ request, /** @type {myCallback} */ opt_callback) => {
      let method = request.method;
      let params = request.params;
      let cal = await BGCalendarService.GetInstance();
      /** @type {Promise<any>} */
      let serviceCall;
      switch (method) {
        case 'auth.interactive':
          serviceCall = BGAuthService.GetAuthToken(true);
          break;
        case 'auth.silent':
          serviceCall = BGAuthService.GetAuthToken(false);
          break;
        case 'auth.clearAllCachedAuthTokens':
          serviceCall = BGAuthService.ClearAllCachedAuthTokens();
          break;
        case 'auth.switchAccount':
          serviceCall = BGAuthService.AuthorizeUsingRedirect(true);
          break;

        case 'calendar.getCalendars':
          serviceCall = cal.getCalendars();
          break;
        case 'calendar.getEvents':
          serviceCall = cal.getEvents(params.minDate, params.maxDate);
          break;
        case 'calendar.addGame':
          serviceCall = cal.addGame(params.game);
          break;
        case 'calendar.removeGame':
          serviceCall = cal.remGame(params.game.calId);
          break;

      }
      serviceCall.then((result) => {
        opt_callback({ ok: true, data: result });
      }).catch((err) => {
        console.log(err);
        opt_callback({ ok: false, data: err });
      });
    };
    chrome.runtime.onMessage.addListener((/** @type {RequestMessage} */ request, sender, /** @type {myCallback} */ opt_callback) => {

      listen(request, opt_callback);

      // Indicates to Chrome that a pending async request will eventually issue
      // the callback passed to this function.
      return true;
    });
  }

};


chrome.windows.onFocusChanged.addListener(() => {
  onTabUpdate();
});

chrome.tabs.onActivated.addListener(() => {
  onTabUpdate();
});



chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    onTabUpdate();
  }
});


background.listenForRequests_();

function onTabUpdate() {
  let queryOptions = { active: true, currentWindow: true };
  chrome.tabs.query(queryOptions, (async (tabs) => {
    if (tabs.length > 0) {
      let url = tabs[0].url;
      if ((url.includes('horizon') || url.includes('arbiter'))) {
        LocalStorageService.SetValue('StatusMessage', await LocalStorageService.GetValue('SyncStatus'));
      } else {
        LocalStorageService.SetValue('StatusMessage', "Current page is not a schedule");
      }
    }
  }));
}
