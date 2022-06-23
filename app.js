/* Javascript to be built alongside html as needed. */

// use session storage to get data between pages
// session storage will hold: recent searches, current account info, current account region

var devkey;
var returnStatus;
var searchRegion;
var searchHistory;
var profileData;
var storedAccounts;
var matchList;

function initHome () {
  getDevKey("./dev-key.json");
  searchRegion = "na1";
  getHistory();

  const toggle = document.getElementById('themeSelect');
  toggle.addEventListener('click', () => {
    if ( this.src == "./assets/dark-theme-icon.svg") {
      console.log('if');
      this.src = "./assets/light-theme-icon.svg";
      console.log(this.src);
    }
    else {
      console.log('else');
      this.src = "./assets/dark-theme-icon.svg";
      console.log(this.src);
    }
  })
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
  
  searchHistory = JSON.parse(localStorage.getItem('searchHistory')); 
  if(searchHistory !== null) {
    var list = document.getElementById("history");
    list.innerHTMLHTML="";
    searchHistory.forEach((account)=>{
      var a = document.createElement("a");
      var newItem = document.createElement("li");
      a.textContent = account.queryName;
      a.setAttribute('href', './summoner/profile.html?region=' + account.region + '&name=' + account.name);
      newItem.appendChild(a);
      list.appendChild(newItem);
    })
  }
  else {
    searchHistory = [];
  }
}

function addToHistory ( queryRegion, name, accountBasics ) {
  let queryName = accountBasics.name;
  let inputAccount = {
    region: queryRegion,
    name: name,
    queryName: queryName,
  }

  let match = false;
  searchHistory.forEach( (element, index, arr) => {
    if ( element.name === name && element.region == queryRegion ) {
      arr.splice(index, 1);
      match = true;
    }
  })
  searchHistory.unshift(inputAccount);
  if ( searchHistory.length > 10 ) 
    searchHistory.pop();

  localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  
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
  let name = formatName( queryName );
  let queryRegion = searchRegion;

  // FUTURE: check if query is a multi account query

  // first, sanitize account name
  if ( containsSpecialChars( name ) || name.length < 3 || name.length > 16 ) {
    return;
  }

  // fetch account basics to see if it exists
  let accountBasics = fetchAccountBasics( queryRegion, name );

  // use output the promise to handle the query appropriately
  accountBasics.then((output) => {
    if ( output === -1 ) {
      invalidAccountSearch( queryRegion, name );
    }
    else 
      validAccountSearch( queryRegion, name, output );
  });
}

async function fetchAccountBasics ( queryRegion, name ) {
  try {
    let response = await fetch('https://'+queryRegion+'.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+name+'?api_key='+devkey);
    if ( !response.ok )
      throw new Error("Account basics not found");
    console.log("api call basics");
    let data = await response.json();
    return data;
  } catch (error){
    console.error(error);
    return -1;
  }
}

async function validAccountSearch( queryRegion, name, accountBasics ) {
  // account is valid and we have the encrypted id
  // check if account is in local storage


  storedAccounts = JSON.parse(localStorage.getItem('accounts'));
  if ( storedAccounts === null ) {
    await updateAccountData( queryRegion, name, accountBasics );
  }
  else {
    let accountMatch = storedAccounts.find( element => element.id == accountBasics.id);
    if (accountMatch !== undefined) {
      // check time since last update
    }
    else {
      await updateAccountData( queryRegion, name, accountBasics );
    }
  }
  // add to search history
  addToHistory( queryRegion, name, accountBasics );
  
  // go to profile page
  window.location = ( './summoner/profile.html?region=' + searchRegion + '&name=' + name);
}

async function updateAccountData ( queryRegion, name, accountBasics) {
  // location of fetch for rank and match history
  // fetch('https://'+queryRegion+'.api.riotgames.com/lol/league/v4/entries/by-summoner/'+accountBasics.id+'?api_key='+devkey)
  var rankData;
  try {
    let response = await fetch('https://'+queryRegion+'.api.riotgames.com/lol/league/v4/entries/by-summoner/'+accountBasics.id+'?api_key='+devkey);
    if ( !response.ok )
      throw new Error("Account rank not found");
    console.log("api call rank");
    rankData = await response.json();
  } catch (error){
    console.error(error);
    rankData = -1;
  }

  
  let account = {
    id: accountBasics.id, 
    name: name,
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
  let region = getParameter('region');
  let name = getParameter('name');
  storedAccounts = JSON.parse(localStorage.getItem('accounts'));
  profileData = storedAccounts.find( element => element.name == name && element.region == region ); 
  getDevKey("../dev-key.json");
  fillProfileData(region, name);
  fetchMatchData(region);
  // get account info from local storage
  // if not in local storage go through checkvalidity
  // if data is in local stroage, use method that
  // fills the page with the saved data
}

function getParameter ( parameterName ) {
  let parameters = new URLSearchParams( window.location.search );
  return parameters.get( parameterName );
}

function fillProfileData ( region, name ) {
  document.getElementById("profile-icon").src = 'http://ddragon.leagueoflegends.com/cdn/12.11.1/img/profileicon/'+profileData.data[0].profileIconId+'.png';  
  document.getElementById("summoner-level").innerHTML = profileData.data[0].summonerLevel;
  document.getElementById("profile-name").innerHTML = profileData.data[0].name;
  document.title = profileData.data[0].name+" - Profile";
  let rankData = profileData.data[1];

  let solo = false, flex = false;

  rankData.forEach(element => {
      if(element.queueType === "RANKED_SOLO_5x5") {
      solo = true;
      document.getElementById("rank-solo-unranked").style.display = "none";
      document.getElementById("db-solo-text1").innerHTML = "Ranked";
      document.getElementById("db-solo-text2").innerHTML = "Solo/Duo";
      document.getElementById("ranked-solo-icon").src = '../assets/ranked-icons/'+element.tier.toLowerCase()+'.webp';
      let rankTier = element.tier.charAt(0) + element.tier.substr(1).toLowerCase();
      if (rankTier == "Master" || rankTier == "Grandmaster" || rankTier == "Challenger") {

      }
      else { rankTier = rankTier+" "+element.rank; }
      document.getElementById("ranked-solo").innerHTML = rankTier; 
      document.getElementById("ranked-solo-lp").innerHTML = element.leaguePoints+" LP";
      document.getElementById("ranked-solo-winloss").innerHTML = Math.round(element.wins * 100 / (element.wins + element.losses)) + "% - "+element.wins+"W "+element.losses+"L";
    }
    else if (element.queueType === "RANKED_FLEX_SR") {
      flex = true;
      document.getElementById("rank-flex-unranked").style.display = "none";
      document.getElementById("db-flex-text1").innerHTML = "Ranked";
      document.getElementById("db-flex-text2").innerHTML = "Flex";
      document.getElementById("ranked-flex-icon").src = '../assets/ranked-icons/'+element.tier.toLowerCase()+'.webp';
      let rankTier = element.tier.charAt(0) + element.tier.substr(1).toLowerCase();
      if (rankTier == "Master" || rankTier == "Grandmaster" || rankTier == "Challenger") {

      }
      else { rankTier = rankTier+" "+element.rank; }
      document.getElementById("ranked-flex").innerHTML = rankTier; 
      document.getElementById("ranked-flex-lp").innerHTML = element.leaguePoints+" LP";
      document.getElementById("ranked-flex-winloss").innerHTML = Math.round(element.wins * 100 / (element.wins + element.losses)) + "% - "+element.wins+"W "+element.losses+"L";
    }
  })
  if(!solo) { document.getElementById("rank-solo-check").style.display = "none"; }
  if(!flex) { document.getElementById("rank-flex-check").style.display = "none"; }
  
}

async function fetchMatchData ( region ) {
  var matchData;
  var apiRegion = getContinent(region);
  var puuid = profileData.data[0].puuid;
  try {
    let response = await fetch('https://'+apiRegion+'.api.riotgames.com/lol/match/v5/matches/by-puuid/'+puuid+'/ids?start=0&count=8&api_key='+devkey);
    if( !response.ok )
      throw new Error("Account match history not found");
    console.log("api call match list");
    matchList = await response.json();
  } catch (error) {
    console.error(error);
    matchList = -1;
  }

  matchData = profileData.data[2];
  for (const element of matchList) {
    var matchDetails;
    if( matchData !== undefined ) {
      let matchFound = matchData.find( innerElement => innerElement.matchID == element);
      if( matchFound !== undefined ) {
        console.log("match already stored");
      }
      else {
        console.log("match not in history");
        matchDetails = await fetchMatchDetails(apiRegion, element);
        matchData.push({
          matchID: element,
          matchDetails,
        })
        if( profileData.data[2] == null && profileData.data.length === 2)
          profileData.data.push(matchData);
        else 
          profileData.data[2] = matchData;
      }
    }
    else {
      console.log("match not in history");
      matchDetails = await fetchMatchDetails(apiRegion, element);
      matchData = [
        {
          matchID: element,
          matchDetails,
        }
      ];
      if( profileData.data[2] == null && profileData.data.length === 2)
        profileData.data.push(matchData);
      else 
        profileData.data[2] = matchData;

      
    }
    //fillMatchData( element );
  }
  

  console.log(storedAccounts);
}

async function fetchMatchDetails ( apiRegion, matchID ) {
  var output;
  try {
    let response = await fetch('https://'+apiRegion+'.api.riotgames.com/lol/match/v5/matches/'+matchID+'?api_key='+devkey)
    if( !response.ok )
      throw new Error("Match details not found for: "+matchID);
    console.log("api call match details");
    output = await response.json();
  } catch (error) {
    console.error(error);
    output = -1;
  }
  return output;
}

function fillMatchData ( matchID ) {  
  var matchInfo = profileData.data[2].find(element => element.matchID == matchID);
  var parIndex = matchInfo.matchDetails.metadata.participants.indexOf(profileData.data[0].puuid);

  var list = document.getElementById("match-list");
  var newMatch = document.createElement("div");
  newMatch.classList.add('dashboard-main-content-match', matchInfo.matchDetails.info.participants[parIndex].win?'win':'loss');
  newMatch.textContent = matchInfo.matchDetails.info.participants[parIndex].win ? "Victory" : "Defeat"
  

  
  list.appendChild(newMatch);

  
}

function getContinent ( region ) {
  if( region === 'na1' )
    return 'americas';
  if( region === 'kr' )
    return 'asia';
  if( region === 'euw1' || region === 'eun1' ) 
    return 'europe';
}