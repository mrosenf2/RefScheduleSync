/**
 * The Calendar Feed Parser namespace.
 * @namespace
 */
var auth = {};


/**
 * Shows a UI to request an OAuth token. This should only be called in response
 * to user interaction to avoid confusing the user. Since the resulting window
 * is shown with no standard window decorations, it can end up below all other
 * windows, with no way to detect that it was shown, and no way to reposition
 * it either.
 */
auth.requestInteractiveAuthToken = function() {
  console.log('auth.requestInteractiveAuthToken()');
  chrome.identity.getAuthToken({'interactive': true}, function(accessToken) {
    if (chrome.runtime.lastError || !accessToken) {
      console.log('getAuthToken: ' + chrome.runtime.lastError.message);
      return;
    }
    
    //auth.fetchCalendars();
  });
};

/**
 * determines if user is signed in or not based on if auth token is produced
 */
auth.getAuthToken = function(interactive = false) {
  return new Promise(function(resolve, reject) {
    console.log('auth.getAuthToken()');
    chrome.identity.getAuthToken({'interactive': interactive}, function(authToken) {
      //console.log(authToken)
      if(authToken) {
        resolve(authToken)
      } else (
        reject(new Error('getAuthToken: ' + chrome.runtime.lastError.message))
      )
    })
  })
}
