

/**
 * The namespace for background page related functionality.
 * @namespace
 */
var background = {};
/** unused */
background.getGamesFromStorage = new Promise(function(resolve, reject) {
  chrome.storage.local.get(['games'], function(result) {        
      resolve(result)
  });
})
background.listenForRequests_ = function() {
  chrome.extension.onMessage.addListener(function(request, sender, opt_callback) {
    cal.init()
    switch (request.method) {      
      case 'auth.interactive':
        auth.getAuthToken(true).then(
          function(result) {
            opt_callback(result)
          }, function(err) {
            opt_callback(null)
          }
        )        
        break;

      case 'auth.silent':        
        auth.getAuthToken(false).then(
          function(result) {
            opt_callback(result)
          }, function(err) {
            opt_callback(null)
          }
        )
        break;

      case 'calendar.getEvents':
        cal.getEvents().then(function(result) {
          opt_callback(result);
        }, function(err) {
          console.log(err);          
          opt_callback(null)
        })        
        break;
      case 'calendar.addGame':
        cal.addGame(request.game).then(
          function(result) {
            opt_callback(result)
          }, function(err) {
            console.log(err);
            opt_callback(false)
          }
        )
        break;
      case 'calendar.removeGame':
        cal.remGame(request.game.calId).then(
          function(result) {
            opt_callback(result)            
          }, function(err) {
            console.log(err)
            opt_callback(false)
          }
        )        
        break;
      case 'gameInfo':
        opt_callback(request.gameObj);
        break;
    }

    // Indicates to Chrome that a pending async request will eventually issue
    // the callback passed to this function.
    return true;
  });
};

background.listenForRequests_();