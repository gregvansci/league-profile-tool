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
var pending = false;

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

function popupMessage ( elementID ) {
  if (pending) return;
  pending = true;
  let popup = document.getElementById(elementID);
  popup.classList.add("show");
  setTimeout( () => {
    popup.classList.remove("show");
    pending = false;
  }, 1000);
  
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
    let response = await fetch('https://'+apiRegion+'.api.riotgames.com/lol/match/v5/matches/by-puuid/'+puuid+'/ids?start=0&count=4&api_key='+devkey);
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
    fillMatchData( element );
  }

  localStorage.setItem('accounts', JSON.stringify(storedAccounts));

  //console.log(storedAccounts);
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
  // fill match data into html

  var matchData = profileData.data[2].find(element => element.matchID == matchID);
  var parIndex = matchData.matchDetails.metadata.participants.indexOf(profileData.data[0].puuid);
  var outcome = matchData.matchDetails.info.participants[parIndex].win?'win':'loss';
  var profileStats = matchData.matchDetails.info.participants[parIndex];
  console.log(matchData);
  console.log(profileStats);

  var match = document.createElement("div");
  match.classList.add('dashboard-main-content-match', outcome);
  var matchInfo = document.createElement("div");
  matchInfo.classList.add('match-tile-info');
  var matchInfoHeader = document.createElement("div");
  matchInfoHeader.classList.add('match-tile-info-header');
  var matchInfoHeaderQueue = document.createElement("div");
  matchInfoHeaderQueue.classList.add('match-tile-info-header-queue');
  var queueID = matchData.matchDetails.info.queueId;
  var queueType;
  if (queueID == 420) { queueType = "Ranked Solo"; }
  else if (queueID == 440) { queueType = "Ranked Flex"; }
  else if (queueID == 400) { queueType = "Normal"; }
  else queueType = "Unhandled";
  matchInfoHeaderQueue.textContent = queueType + "\t - \t";
  matchInfoHeader.appendChild(matchInfoHeaderQueue);
  var matchInfoHeaderLength = document.createElement("div");
  matchInfoHeaderLength.classList.add('match-tile-info-header-length');
  matchInfoHeaderLength.textContent = matchData.matchDetails.info.gameDuration + "seconds";
  console.log(matchInfoHeaderLength.textContent);
  matchInfoHeader.appendChild(matchInfoHeaderLength);
  var matchInfoHeaderAge = document.createElement("div");
  matchInfoHeaderAge.classList.add('match-tile-info-header-age');
  matchInfoHeaderAge.textContent = "5 seconds ago";
  matchInfoHeader.appendChild(matchInfoHeaderAge);
  matchInfo.appendChild(matchInfoHeader);
  var matchInfoContent = document.createElement("div");
  matchInfoContent.classList.add('match-tile-info-content');
  
  var matchInfoContent1 = document.createElement("div");
  matchInfoContent1.classList.add('match-tile-info-content-1');
  var matchInfoContent1Champ = document.createElement("div");
  matchInfoContent1Champ.classList.add('match-tile-info-content-1-champ', outcome);
  var matchInfoContent1ChampImg = document.createElement("img");
  matchInfoContent1ChampImg.src = "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/champion/" + profileStats.championName + ".png";
  matchInfoContent1Champ.appendChild(matchInfoContent1ChampImg);
  matchInfoContent1.appendChild(matchInfoContent1Champ);

  var matchInfoContent1Setup = document.createElement("div");
  matchInfoContent1Setup.classList.add('match-tile-info-content-1-setup');
  var matchInfoContent1Setup1 = document.createElement("img");
  matchInfoContent1Setup1.src = "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/spell/" + getSummoner(profileStats.summoner1Id) + ".png";
  matchInfoContent1Setup.appendChild(matchInfoContent1Setup1);
  var matchInfoContent1Setup2 = document.createElement("img");
  matchInfoContent1Setup2.src = "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/spell/" + getSummoner(profileStats.summoner2Id) + ".png";
  matchInfoContent1Setup.appendChild(matchInfoContent1Setup2);
  var matchInfoContent1Setup3 = document.createElement("img");
  matchInfoContent1Setup3.src = "https://cdn.mobalytics.gg/assets/lol/images/perks/"+profileStats.perks.styles[0].selections[0].perk+".png";
  matchInfoContent1Setup.appendChild(matchInfoContent1Setup3);
  matchInfoContent1.appendChild(matchInfoContent1Setup);
  matchInfoContent.appendChild(matchInfoContent1);
  
  var matchInfoContent2 = document.createElement("div");
  matchInfoContent2.classList.add('match-tile-info-content-2');
  var matchInfoContent2Scoreline = document.createElement("div");
  matchInfoContent2Scoreline.classList.add('match-tile-info-content-2-scoreline');
  var matchInfoContent2Scoreline1 = document.createElement("h3");
  matchInfoContent2Scoreline1.textContent = profileStats.kills + "/" + profileStats.deaths + "/" + profileStats.assists;
  matchInfoContent2Scoreline.appendChild(matchInfoContent2Scoreline1);
  var matchInfoContent2Scoreline2 = document.createElement("h5");
  matchInfoContent2Scoreline2.textContent = Math.round(profileStats.kills+profileStats.assists/profileStats.deaths * 100)/100 + " KDA";
  matchInfoContent2Scoreline.appendChild(matchInfoContent2Scoreline2);
  matchInfoContent2.appendChild(matchInfoContent2Scoreline);

  var matchInfoContent2Items = document.createElement("div");
  matchInfoContent2Items.classList.add('match-tile-info-content-2-items');
  var matchInfoContent2Items0 = document.createElement("img");
  matchInfoContent2Items0.src = profileStats.item0 ? "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/item/" + profileStats.item0 + ".png" : "";
  matchInfoContent2Items.appendChild(matchInfoContent2Items0);
  var matchInfoContent2Items1 = document.createElement("img");
  matchInfoContent2Items1.src = profileStats.item1 ? "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/item/" + profileStats.item1 + ".png" : "";
  matchInfoContent2Items.appendChild(matchInfoContent2Items1);
  var matchInfoContent2Items2 = document.createElement("img");
  matchInfoContent2Items2.src = profileStats.item2 ? "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/item/" + profileStats.item2 + ".png" : "";
  matchInfoContent2Items.appendChild(matchInfoContent2Items2);
  var matchInfoContent2Items3 = document.createElement("img");
  matchInfoContent2Items3.src = profileStats.item3 ? "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/item/" + profileStats.item3 + ".png" : "";
  matchInfoContent2Items.appendChild(matchInfoContent2Items3);
  var matchInfoContent2Items4 = document.createElement("img");
  matchInfoContent2Items4.src = profileStats.item4 ? "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/item/" + profileStats.item4 + ".png" : "";
  matchInfoContent2Items.appendChild(matchInfoContent2Items4);
  var matchInfoContent2Items5 = document.createElement("img");
  matchInfoContent2Items5.src = profileStats.item5 ? "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/item/" + profileStats.item5 + ".png" : "";
  matchInfoContent2Items.appendChild(matchInfoContent2Items5);
  var matchInfoContent2Items6 = document.createElement("img");
  matchInfoContent2Items6.src = profileStats.item6 ? "https://ddragon.leagueoflegends.com/cdn/12.12.1/img/item/" + profileStats.item6 + ".png" : "";
  matchInfoContent2Items.appendChild(matchInfoContent2Items6);
  matchInfoContent2.appendChild(matchInfoContent2Items);
  matchInfoContent.appendChild(matchInfoContent2);

  var matchInfoContent3 = document.createElement("div");
  matchInfoContent3.classList.add('match-tile-info-content-3');
  var matchInfoContent3CS = document.createElement("div");
  matchInfoContent3CS.classList.add('match-tile-info-content-3-cs');
  matchInfoContent3CS.textContent = profileStats.totalMinionsKilled + " (" + Math.round(profileStats.totalMinionsKilled*60/profileStats.timePlayed*10) / 10 + ") ";
  var matchInfoContent3CSSpan = document.createElement("span");
  matchInfoContent3CSSpan.textContent = "CS";
  matchInfoContent3CS.appendChild(matchInfoContent3CSSpan);
  matchInfoContent3.appendChild(matchInfoContent3CS);
  
  var matchInfoContent3KP = document.createElement("div");
  matchInfoContent3KP.classList.add('match-tile-info-content-3-kp');
  matchInfoContent3KP.textContent = Math.round(((profileStats.kills + profileStats.assists) / (parIndex <= 4 ? matchData.matchDetails.info.teams[0].objectives.champion.kills : matchData.matchDetails.info.teams[1].objectives.champion.kills)) * 1000) / 10 + "% ";
  var matchInfoContent3KPSpan = document.createElement("span");
  matchInfoContent3KPSpan.textContent = "KP";
  matchInfoContent3KP.appendChild(matchInfoContent3KPSpan);
  matchInfoContent3.appendChild(matchInfoContent3KP);

  var matchInfoContent3Wards = document.createElement("div");
  matchInfoContent3Wards.classList.add('match-tile-info-content-3-wards');
  matchInfoContent3Wards.textContent = profileStats.wardsPlaced + " (" + profileStats.wardsKilled + ") / " + profileStats.detectorWardsPlaced + " ";
  var matchInfoContent3WardsSpan = document.createElement("span");
  matchInfoContent3WardsSpan.textContent = "Wards";
  matchInfoContent3Wards.appendChild(matchInfoContent3WardsSpan);
  matchInfoContent3.appendChild(matchInfoContent3Wards);

  var matchInfoContent3Vision = document.createElement("div");
  matchInfoContent3Vision.classList.add('match-tile-info-content-3-vision');
  matchInfoContent3Vision.textContent = profileStats.visionScore + " ";
  var matchInfoContent3VisionSpan = document.createElement("span");
  matchInfoContent3VisionSpan.textContent = "Vision";
  matchInfoContent3Vision.appendChild(matchInfoContent3VisionSpan);
  matchInfoContent3.appendChild(matchInfoContent3Vision);

  matchInfoContent.appendChild(matchInfoContent3);

  matchInfo.appendChild(matchInfoContent);

  var matchComp = document.createElement("div");
  matchComp.classList.add('match-tile-comp');
  var matchCompTop = document.createElement("div");
  matchCompTop.classList.add('match-tile-comp-role');
  var player0 = document.createElement("a");
  player0.textContext = matchData.matchDetails.info.participants[0].summonerName;
  player0.href = ('./summoner/profile.html?region=' + searchRegion + '&name=' + player0.textContext);
  //player0.style.add("text-align: right");
  matchCompTop.appendChild(player0);
  var matchChampIcon0 = document.createElement("div");



  match.appendChild(matchInfo);
  
  document.getElementById("match-list").appendChild(match);
}

function getSummoner ( id ) {
  if( id === 3 ) {
    return "SummonerExhaust";
  }
  else if( id === 4 ) {
    return "SummonerFlash";
  }
  else if( id === 6 ) {
    return "Ghost";
  }
  else if( id === 12 ) {
    return "Teleport";
  }
  else if( id === 13 ) {
    return "Smite";
  }
  else if( id === 14 ) {
    return "SummonerExhaust";
  }
  
}

function getContinent ( region ) {
  if( region === 'na1' )
    return 'americas';
  if( region === 'kr' )
    return 'asia';
  if( region === 'euw1' || region === 'eun1' ) 
    return 'europe';
}
