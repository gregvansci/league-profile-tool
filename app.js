/* Javascript to be built alongside html as needed. */

// use session storage to get data between pages
// session storage will hold: recent searches, current account info, current account region

var devkey;
var returnStatus;
var searchRegion;
var profileData;
var storedAccounts;

function initHome () {
  getDevKey("./dev-key.json");
  searchRegion = "na1";
  getHistory();
}

function getDevKey(keyPath) {
  if (localStorage.getItem('devkey') === null) {
    fetch(keyPath)
    .then(response => response.json())
    .then(data => {
      devkey = data.devkey;
      localStorage.setItem('devkey', devkey);
    })  
    .catch(err => console.error(err))
  }
  else 
    devkey = localStorage.getItem('devkey');
}

function setRegion ( queryRegion ) {
  document.getElementById(searchRegion).classList.replace('region-icon-selected', 'region-icon-nonselected');
  searchRegion = queryRegion;
  document.getElementById(searchRegion).classList.replace('region-icon-nonselected', 'region-icon-selected');
}

function getHistory () {
  let list = document.getElementById("history");
  list.innerHTMLHTML="";
  if(localStorage.getItem('searchHistory') !== null) {
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') );
    searchHistory.accounts.forEach((acc)=>{
      let li = document.createElement('li');
      li.innerText = acc.name;
      list.appendChild(li);
    })
  }
}

function containsSpecialChars(str) {
  const specialCharacters = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return specialCharacters.test(str);
}

function formatName( input ) {
  let output = input.toLowerCase();
  return output.replace(/\s/g, '');

}

function searchAccount ( queryName ) {
  // this function is where we call the api to gather data
  // goal is to minimize api calls
  queryName = formatName( queryName );
  let queryRegion = searchRegion;

  // FUTURE: check if query is a multi account query

  // first, sanitize account name
  if ( containsSpecialChars( queryName ) || queryName.length < 3 || queryName.length > 16 ) {
    return;
  }

  // fetch account basics to see if it exists
  let accountBasics = fetchAccountBasics( queryRegion, queryName );

  // use output the promise to handle the query appropriately
  accountBasics.then((output) => {
    if ( output === -1 ) {
      invalidAccountSearch( queryRegion, queryName );
    }
    else 
      validAccountSearch( queryRegion, queryName, output );
  });
}

async function fetchAccountBasics ( queryRegion, queryName ) {
  try {
    let response = await fetch('https://'+queryRegion+'.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+queryName+'?api_key='+devkey);
    if ( !response.ok )
      throw new Error("Account basics not found");
    let data = await response.json();
    return data;
  } catch (error){
    console.error(error);
    return -1;
  }
}

async function validAccountSearch( queryRegion, queryName, accountBasics ) {
  // account is valid and we have the encrypted id
  // check if account is in local storage


  storedAccounts = JSON.parse(localStorage.getItem('accounts'));
  if ( storedAccounts === null ) {
    await updateAccountData( queryRegion, queryName, accountBasics );
  }
  else {
    let accountMatch = storedAccounts.find( element => element.id == accountBasics.id);
    if (accountMatch !== undefined) {
      // check time since last update
    }
    else {
      await updateAccountData( queryRegion, queryName, accountBasics );
    }
  }

  // go to profile page
  window.location = ( './summoner/profile.html?region=' + searchRegion + '&name=' + queryName);
}

async function updateAccountData ( queryRegion, queryName, accountBasics) {
  // location of fetch for rank and match history
  // fetch('https://'+queryRegion+'.api.riotgames.com/lol/league/v4/entries/by-summoner/'+accountBasics.id+'?api_key='+devkey)
  var rankData;
  var matchData;
  try {
    let response = await fetch('https://'+queryRegion+'.api.riotgames.com/lol/league/v4/entries/by-summoner/'+accountBasics.id+'?api_key='+devkey);
    if ( !response.ok )
      throw new Error("Account rank not found");
    rankData = await response.json();
  } catch (error){
    console.error(error);
    rankData = -1;
  }

  
  let account = {
    id: accountBasics.id, 
    name: queryName,
    region: queryRegion,
    data: [
      accountBasics,
      rankData,
    ]
  };
  if ( storedAccounts === null ) {
    storedAccounts = [
      account,
    ]
  }
  else {
    storedAccounts.push(account);
  }

  localStorage.setItem('accounts', JSON.stringify(storedAccounts));
}

function invalidAccountSearch ( queryRegion, queryName ) {
  console.log("Invalid account page coming later");
}

function initProfile () {
  getDevKey("../dev-key.json");
  fillProfileData(getParameter('region'), getParameter('name'));

  // get account info from local storage
  // if not in local storage go through checkvalidity
  // if data is in local stroage, use method that
  // fills the page with the saved data
}

function getParameter ( parameterName ) {
  let parameters = new URLSearchParams( window.location.search );
  return parameters.get( parameterName );
}

function fillProfileData ( queryRegion, queryName ) {
  storedAccounts = JSON.parse(localStorage.getItem('accounts'));
  console.log(queryName);
  profileData = storedAccounts.find( element => element.name == queryName && element.region == queryRegion );
  console.log(profileData);
}


// async function fetchAccount (queryRegion, queryName) { 
//   let accountInfo = await fetch('https://'+queryRegion+'.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+queryName+'?api_key='+devkey);
//   let accountInfoJson = await accountInfo.json();
//   return accountInfoJson;
// } 




// function initIndex() {
//   getDevKey("./dev-key.json");
//   searchRegion = "na1";
//   getHistory();
// }

// function getDevKey(keyPath) {
//   if (localStorage.getItem('devkey') === null) {
//     fetch(keyPath)
//     .then(response => response.json())
//     .then(data => {
//       devkey = data.devkey;
//       localStorage.setItem('devkey', devkey);
//     })  
//   }
//   else 
//     devkey = localStorage.getItem('devkey');
// }


// function getHistory() {
//   let list = document.getElementById("history");
//   list.innerHTMLHTML="";
//   if(localStorage.getItem('searchHistory') !== null) {
//     let searchHistory = JSON.parse(localStorage.getItem('searchHistory') );
//     searchHistory.accounts.forEach((acc)=>{
//       let li = document.createElement('li');
//       li.innerText = acc.name;
//       list.appendChild(li);
//     })
//   }
// }

// function setRegion(region) {
//   document.getElementById(searchRegion).classList.replace('region-icon-selected', 'region-icon-nonselected');
//   searchRegion = region;
//   document.getElementById(searchRegion).classList.replace('region-icon-nonselected', 'region-icon-selected');
// }

// function containsSpecialChars(str) {
//   const specialCharacters = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
//   return specialCharacters.test(str);
// }

// function testFunction() {
//   console.log("test function output");
// }

// function checkValidity( queryName ) {
//   queryName = queryName.value;
//   let queryRegion = searchRegion;
//   // check if multi lookup
//   if(/[,]/.test( queryName )) {
//     console.log("Multi Profile Lookup")
//   }

//   // check if single lookup is valid
//   else if (!containsSpecialChars( queryName ) && queryName.length >= 3 && queryName.length <= 16 ) {
//     // method to get account info
//     var accounts = localStorage.getItem('accounts');
//     if (accounts === null) {
//       accounts = [];
//       console.log("accounts doesn't exist");
//       console.log(accounts);
//       // api call accounts

//       let accountInfo = fetchAccount( queryRegion, queryName );
//       console.log(accountInfo);

      
//       fetchAccount(  searchRegion, queryName );
//       // if account found
//       // api call its info
//       // create accounts and input account
//       // else go to account not found page
//       // 
//     }
//     else {
//       let account = accounts.find(element => {
//         return element.name === queryName && element.region === searchRegion;
//       })
//       if (account === null) {
//         // api call
//         // if account found
//         // add account to accounts
//         // else go to account not found page
//       }
//       else {
//         // account is found
//         // check when last updated
//         // if updated within five minutes
//         // no api call
//         // else update certain info
//         // go to profile page
//       }
//     }
    
    
//     // check localstorage for account info
//     // if found, use it to fill out page info
//     // if not found, api call
//     // if api call found, save info and go to page
//     // if api call not found, go to notfound html page
    
    
//     //window.location = ( './summoner/profile.html?region=' + searchRegion + '&name=' + queryName.value);
//   }
// }

// async function fetchAccount (queryRegion, queryName) { 
//   let accountInfo = await fetch('https://'+queryRegion+'.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+queryName+'?api_key='+devkey);
//   let accountInfoJson = await accountInfo.json();
//   return accountInfoJson;
// } 


// function fetchAccountDetails ( queryRegion, queryName ) {
  
// }

// function addToAccounts ( queryName ) {

// }






// function initProfile() {
//   getDevKey("../dev-key.json");
//   searchAccount(); 

//   // get account info from local storage
//   // if not in local storage go through checkvalidity
//   // if data is in local stroage, use method that
//   // fills the page with the saved data
// }


// function getParameter ( parameterName ) {
//   let parameters = new URLSearchParams( window.location.search );
//   return parameters.get( parameterName );
// }


// function goHome() {
//   window.location = ("../");
// }

// function searchAccount() {
//   // get parameters
//   let region = getParameter('region');
//   let name = getParameter("name");

//   // assume account is valid for now
//   // fetch summoner by name
//   // https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + name + '?api_key=' + devkey
//   fetchSummonerByName( region, name )

  
  
//   // if account found add it to the history
//   addToHistory( region, name );
// }

// function fetchSummonerByName( region,name ) {
//   var output;
//   fetch('https://'+region+'.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+name+'?api_key='+devkey)
//     .then(res => res.json())
//     .then(data => {
//       console.log(data);
//       if(data.hasOwnProperty("status")) {console.log("account doesn't exist")}
//       else {
//         document.getElementById("profile-icon").src = 'http://ddragon.leagueoflegends.com/cdn/12.11.1/img/profileicon/'+data.profileIconId+'.png';  
//         document.getElementById("summoner-level").innerHTML = data.summonerLevel;
//         document.getElementById("profile-name").innerHTML = data.name;
//         document.title = data.name+" - Profile";
//         fetchEntriesBySummoner( region, data.id)
//       }
      
//     })
// }

// // test case accounts:
// // 5ombre -> neither
// // Kim Down -> both solo and flex ranked
// // Sonder -> only flex ranked


// function fetchEntriesBySummoner( region, id ) {
//   fetch('https://'+region+'.api.riotgames.com/lol/league/v4/entries/by-summoner/'+id+'?api_key='+devkey)
//     .then(res => res.json())
//     .then(data => {
//       console.log(data);
//       let solo = false, flex = false;

//       data.forEach(element => {
//           if(element.queueType === "RANKED_SOLO_5x5") {
//           solo = true;
//           document.getElementById("rank-solo-unranked").style.display = "none";
//           document.getElementById("db-solo-text1").innerHTML = "Ranked";
//           document.getElementById("db-solo-text2").innerHTML = "Solo/Duo";
//           document.getElementById("ranked-solo-icon").src = '../assets/ranked-icons/'+element.tier.toLowerCase()+'.webp';
//           let rankTier = element.tier.charAt(0) + element.tier.substr(1).toLowerCase();
//           if (rankTier == "Master" || rankTier == "Grandmaster" || rankTier == "Challenger") {

//           }
//           else { rankTier = rankTier+" "+element.rank; }
//           document.getElementById("ranked-solo").innerHTML = rankTier; 
//           document.getElementById("ranked-solo-lp").innerHTML = element.leaguePoints+" LP";
//           document.getElementById("ranked-solo-winloss").innerHTML = Math.round(element.wins * 100 / (element.wins + element.losses)) + "% - "+element.wins+"W "+element.losses+"L";
//         }
//         else if (element.queueType === "RANKED_FLEX_SR") {
//           flex = true;
//           document.getElementById("rank-flex-unranked").style.display = "none";
//           document.getElementById("db-flex-text1").innerHTML = "Ranked";
//           document.getElementById("db-flex-text2").innerHTML = "Flex";
//           document.getElementById("ranked-flex-icon").src = '../assets/ranked-icons/'+element.tier.toLowerCase()+'.webp';
//           let rankTier = element.tier.charAt(0) + element.tier.substr(1).toLowerCase();
//           if (rankTier == "Master" || rankTier == "Grandmaster" || rankTier == "Challenger") {

//           }
//           else { rankTier = rankTier+" "+element.rank; }
//           document.getElementById("ranked-flex").innerHTML = rankTier; 
//           document.getElementById("ranked-flex-lp").innerHTML = element.leaguePoints+" LP";
//           document.getElementById("ranked-flex-winloss").innerHTML = Math.round(element.wins * 100 / (element.wins + element.losses)) + "% - "+element.wins+"W "+element.losses+"L";
//         }
//       })
//       if(!solo) { document.getElementById("rank-solo-check").style.display = "none"; }
//       if(!flex) { document.getElementById("rank-flex-check").style.display = "none"; }
//     })
// }

// function addToHistory( region, name ) {  
//   let inputAccount = {
//     region: region,
//     name: name
//   };

//   if (localStorage.getItem('searchHistory') === null) {
//     firstInput = {
//       accounts: [inputAccount]
//     };
//     localStorage.setItem('searchHistory', JSON.stringify(firstInput));
//   }
//   else {
//     let searchHistory = JSON.parse(localStorage.getItem('searchHistory') );
//     searchHistory.accounts.unshift(inputAccount);
//     // line is not working correctly
//     // searchHistory.accounts = [...new Set(searchHistory.accounts)];
//     if (searchHistory.accounts.length > 10) {
//       searchHistory.accounts.pop();
//     }
//     localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
//   } 
// }




