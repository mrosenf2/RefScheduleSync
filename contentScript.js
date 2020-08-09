


/**
 * content namespace
 * @namespace
 */
var content = {}

var arbiterContent = {}

var horizonContent = {}

arbiterContent.btnIsSignedIn = "isSignedIn"
arbiterContent.tbID = "ctl00_ContentHolder_pgeGameScheduleEdit_conGameScheduleEdit_dgGames"

horizonContent.tbID = "schedResults"

/**
 * Adds column to table. Sends info about games to background listener.
 */
arbiterContent.addSyncColumn = function (isSignedIn, authtoken) {
    console.trace()
    var tbID = arbiterContent.tbID
    var tblRows = document.getElementById(tbID).children[0].children    
    var totalPay = 0        
    var txtIsSignedIn
    var stgGames = []
    var isAccepted;
    for (let row of tblRows) {
        row.insertCell(2);
        if (row.className.toLowerCase().includes("headers")) {
            row.cells[0].style = "white-space:nowrap;"
            row.cells[1].style = "white-space:nowrap;"            
            txtIsSignedIn = document.createElement("p")            
            if(isSignedIn) {                                
                txtIsSignedIn.innerHTML = "Sync"
                txtIsSignedIn.title = "Click to refresh checkboxes"
            } else {                
                txtIsSignedIn.innerHTML = "Sign in to Sync"
                txtIsSignedIn.title = "Sign In"
            }
            txtIsSignedIn.id = arbiterContent.btnIsSignedIn
            txtIsSignedIn.style = "white-space:nowrap;color:White;cursor:pointer;"
            txtIsSignedIn.onclick = function() {
                chrome.runtime.sendMessage({method: 'auth.interactive'}, function(token) {
                    //callback will have authtoken in response parameter
                    //TODO: write content.update sync coloumn
                    arbiterContent.sync()
                })
            }
            row.cells[2].append(txtIsSignedIn)                        
        }
        if (row.className.toLowerCase().includes("items")) {            
            //create sync checkbox
            var cb = document.createElement("input")
            cb.type = "checkbox"
            if(row.cells.length >= 11) {
                isAccepted = row.cells[10].textContent.search("Accepted") > 0
            }
            
            if(!isSignedIn || !isAccepted){                                
                cb.disabled = true
                console.trace('cb.disabled = true')                
            }
            row.cells[2].append(cb)            
            var gameObj = arbiterContent.getGameObj(cb, row);
            stgGames.push(gameObj)
            totalPay += Number(gameObj.pay.replace(/[^0-9.-]+/g, ""))                        
        }
    }
    var el = document.createElement("p")
    el.innerText = "Total: " + totalPay.toString()
    document.getElementById(tbID).appendChild(el)
    
}

/**
 * Adds column to table. Sends info about games to background listener.
 */
horizonContent.addSyncColumn = function (isSignedIn) {
    console.trace()
    let tbID = horizonContent.tbID
    let tblRows = document.getElementById(tbID).children[0].children    
    let totalPay = 0
    let txtIsSignedIn
    let stgGames = []
    let isAccepted;
    for (let row of tblRows) {
        row.insertCell(2);
        if (row.className.toLowerCase().includes("headers")) {
            row.cells[0].style = "white-space:nowrap;"
            row.cells[1].style = "white-space:nowrap;"            
            txtIsSignedIn = document.createElement("p")            
            if(isSignedIn) {                                
                txtIsSignedIn.innerHTML = "Sync"
                txtIsSignedIn.title = "Click to refresh checkboxes"
            } else {                
                txtIsSignedIn.innerHTML = "Sign in to Sync"
                txtIsSignedIn.title = "Sign In"
            }
            txtIsSignedIn.id = arbiterContent.btnIsSignedIn
            txtIsSignedIn.style = "white-space:nowrap;color:White;cursor:pointer;"
            txtIsSignedIn.onclick = function() {
                chrome.runtime.sendMessage({method: 'auth.interactive'}, function(token) {
                    //callback will have authtoken in response parameter
                    //TODO: write content.update sync coloumn
                    horizonContent.sync()
                })
            }
            row.cells[2].append(txtIsSignedIn)                        
        }
        if (row.className.toLowerCase().includes("items")) {            
            //create sync checkbox
            var cb = document.createElement("input")
            cb.type = "checkbox"
            if(row.cells.length >= 11) {
                isAccepted = row.cells[10].textContent.search("Accepted") > 0
            }
            
            if(!isSignedIn || !isAccepted){                                
                cb.disabled = true
                console.trace('cb.disabled = true')                
            }
            row.cells[2].append(cb)            
            var gameObj = arbiterContent.getGameObj(cb, row);
            stgGames.push(gameObj)
            totalPay += Number(gameObj.pay.replace(/[^0-9.-]+/g, ""))                        
        }
    }
    var el = document.createElement("p")
    el.innerText = "Total: " + totalPay.toString()
    document.getElementById(tbID).appendChild(el)
    
}

arbiterContent.cbClicked = function() {
    var gameObj = this
    gameObj.calId = gameObj.checkbox.title //get new calID because it doesnt update from when event listener is first bound
    if (gameObj.checkbox.checked) {
        //add game to calendar
        gameObj.checkbox.disabled = true
        gameObj.init().then(function(game) {
            chrome.runtime.sendMessage({method: 'calendar.addGame', game: game}, function(isSuccess) {
                if(!isSuccess) {
                    gameObj.checkbox.checked = false
                    alert("error occurred; calendar not updated")
                }
                arbiterContent.sync()
                gameObj.checkbox.disabled = false
            })
        })        
    } else {
        //remove game to calendar
        chrome.runtime.sendMessage({method: 'calendar.removeGame', game: gameObj}, function(isSuccess) {
            if(!isSuccess) {
                gameObj.checkbox.checked = true
                alert("error occurred; calendar not updated")
            }
            arbiterContent.sync()
            gameObj.checkbox.disabled = false
        })
    }

}




arbiterContent.getGameObj = function(cb, row) {
    const GAME_ID = 0, DATE = 4, LEVEL = 5, LOCATION = 6, HOME_TEAM = 7, AWAY_TEAM = 8, PAY = 9
    var gameObj = {
        checkbox: cb,
        gameID: row.cells[GAME_ID].innerText,
        date: moment(row.cells[DATE].innerText, "MM-DD-YYYY h:m a").format(),
        level: row.cells[LEVEL].innerText,
        location: row.cells[LOCATION].innerText,
        address: "",
        home: row.cells[HOME_TEAM].innerText,
        away: row.cells[AWAY_TEAM].innerText,
        pay: row.cells[PAY].innerText,
        detailsURL: row.cells[GAME_ID].children[0].href,
        locationURL: row.cells[LOCATION].children[0].href,
        officials: "",
        calId: null,

        //when a function lives in an object, it's called a METHOD. 
        getOfficials() {
            var _this = this
            return new Promise(function(resolve, reject) {
                $.ajax(_this.detailsURL, {
                    success: function(data) {
                        var tblID = '#ctl00_ContentHolder_pgeGameView_conGameView_dgSlots'                    
                        var table = $(tblID, data)[0].children[0];
                        var name1 = table.children[1].children[0].innerText.trim()
                        var name2 = null
                        try { name2 = table.children[2].children[0].innerText.trim() } catch (error) {/* no name2 */}                        
                        resolve(name2 ? name1 + " & " + name2: name1)
                    }, error: function(response) {
                        console.log(response)                    
                        reject(response)
                    }
                })
            })            
        },
        getLocation() {
            var _this = this;
            return new Promise(function(resolve, reject) {
                $.ajax(_this.locationURL,{                
                    success: function(data){
                        var addrID = '#ctl00_ContentHolder_pgeRecordView_conRecordView_lnkAddress'                    
                        var table = $(addrID, data)[0]
                        var addr1 = table.children[0].innerText
                        var addr2 = table.children[2].innerText
                        resolve(`${addr1} ${addr2}`.trim())
                    }, error: function(response) {
                        console.log(response)                        
                        reject(response)
                    }
                })
            })
            
        },        

        async init(){
            try {
                let offs = await this.getOfficials()
                this.officials = offs
                let addr = await this.getLocation()
                this.address  = addr                
                return this                
            } catch (error) {
                console.log('Error:', error);
                return this
            }
            
        }
    }    
    return gameObj;
}



arbiterContent.sync = function(addOnClick = false) {
    console.trace()
    var tbID = arbiterContent.tbID
    var tblRows = document.getElementById(tbID).children[0].children
    
    chrome.runtime.sendMessage({method: 'calendar.getEvents'}, function (events) {
        if(events) {
            var isCanceled = false;
            for(let row of tblRows) {
                if (row.className.toLowerCase().includes("items")) {                    
                    var cb = row.cells[2].children[0]
                    var isDisabled = cb.disabled
                    cb.disabled = true
                    var gameObj = arbiterContent.getGameObj(cb, row);
                    if(row.cells.length >= 11) {
                        isCanceled = row.cells[10].textContent.search("Canceled") > 0
                    }
                    var match = events.find(ev => ev.start.dateTime == gameObj.date)                    
                    if(match) {
                        cb.checked = true
                        cb.title = match.id                        
                        gameObj.calId = match.id
                        
                        
                        if(isCanceled) {
                            //remove game to calendar
                            chrome.runtime.sendMessage({method: 'calendar.removeGame', game: gameObj}, function(isSuccess) {
                                if(!isSuccess) {
                                    gameObj.checkbox.checked = true
                                    alert("error occurred; calendar not updated")
                                }
                                arbiterContent.sync()
                                gameObj.checkbox.disabled = false
                            })
                        }
                    } else {
                        cb.checked = false
                        cb.title = "n/a"
                        gameObj.calId = null
                    }
                    if(addOnClick){
                        cb.addEventListener('click', arbiterContent.cbClicked.bind(gameObj))
                    }
                    cb.disabled = isDisabled;
                    
                }
            }
            
        } else {
            alert("unable to fetch events from calendar. Try refreshing the page.")
            document.getElementById(arbiterContent.btnIsSignedIn).innerHTML = "Refresh"
            for(let row of tblRows) {
                if (row.className.toLowerCase().includes("items")) {                    
                    var cb = row.cells[2].children[0]
                    cb.disabled = true
                }
            }            
        }            
    })
}
content.init = function() {
    if(window.location.href.includes("horizonwebref")) {
        console.trace("Initializing for horizonwebref")


    } else if(window.location.href.includes("arbitersports")) {
        console.trace("Initializing for arbitersports")
        chrome.runtime.sendMessage({method: 'auth.silent'}, function (token) {
            //callback will pass token or null
            if(token) {
                arbiterContent.addSyncColumn(true, token)
                arbiterContent.sync(true)
            } else {
                arbiterContent.addSyncColumn(false)
            }
        })
    }
}
window.addEventListener('load', function() {  
    content.init()    
  }, false);




