/* Javascript to be built alongside html as needed. */

// use session storage to get data between pages
// session storage will hold: recent searches, current account info, current account region

var devkey;
var returnStatus;
var searchRegion;

function initIndex() {
  getDevKey("./dev-key.json");
  searchRegion = "na1";
  getHistory();
}

function initProfile() {
  getDevKey("../dev-key.json");
  searchAccount(); 
}

function getDevKey(keyPath) {
  if (localStorage.getItem('devkey') === null) {
    fetch(keyPath)
    .then(response => response.json())
    .then(data => {
      devkey = data.devkey;
      localStorage.setItem('devkey', devkey);
    })  
  }
  else 
    devkey = localStorage.getItem('devkey');
}


function getHistory() {
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

function setRegion(region) {
  document.getElementById(searchRegion).classList.replace('region-icon-selected', 'region-icon-nonselected');
  searchRegion = region;
  document.getElementById(searchRegion).classList.replace('region-icon-nonselected', 'region-icon-selected');
}

function containsSpecialChars(str) {
  const specialCharacters = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return specialCharacters.test(str);
}

function testFunction() {
  console.log("test function output");
}

function checkValidity( queryName ) {
  // check for special characters
  console.log("submit");
  if (!containsSpecialChars( queryName.value ) && queryName.value.length >= 3 && queryName.value.length <= 16 ) {
    // go to account page
    window.location = ( './summoner/profile.html?region=' + searchRegion + '&name=' + queryName.value);
  }
}

function getParameter ( parameterName ) {
  let parameters = new URLSearchParams( window.location.search );
  return parameters.get( parameterName );
}


function goHome() {
  window.location = ("../");
}

function searchAccount() {
  // get parameters
  let region = getParameter("region");
  let name = getParameter("name");

  // assume account is valid for now
  // fetch summoner by name
  // https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + name + '?api_key=' + devkey
  fetchSummonerByName( region, name )

  
  
  // if account found add it to the history
  addToHistory( region, name );
}

function fetchSummonerByName( region,name ) {
  var output;
  fetch('https://'+region+'.api.riotgames.com/lol/summoner/v4/summoners/by-name/'+name+'?api_key='+devkey)
    .then(res => res.json())
    .then(data => {
      console.log(data);
      if(data.hasOwnProperty("status")) {console.log("account doesn't exist")}
      else {
        document.getElementById("profile-icon").src = 'http://ddragon.leagueoflegends.com/cdn/12.11.1/img/profileicon/'+data.profileIconId+'.png';  
        document.getElementById("summoner-level").innerHTML = data.summonerLevel;
        document.getElementById("profile-name").innerHTML = data.name;
        fetchEntriesBySummoner( region, data.id)
      }
      
    })
}

// test case accounts:
// 5ombre -> neither
// Kim Down -> both solo and flex ranked
// Sonder -> only flex ranked


function fetchEntriesBySummoner( region, id) {
  fetch('https://'+region+'.api.riotgames.com/lol/league/v4/entries/by-summoner/'+id+'?api_key='+devkey)
    .then(res => res.json())
    .then(data => {
      console.log(data);
      data.forEach(element => {
        if(element.queueType === "RANKED_SOLO_5x5") {
          document.getElementById("ranked-solo-icon").src = '../assets/ranked-icons/'+element.tier.toLowerCase()+'.webp';
          document.getElementById("ranked-solo").innerHTML = element.tier+" "+element.rank; 
          document.getElementById("ranked-solo-lp").innerHTML = element.leaguePoints+" LP";
          document.getElementById("ranked-solo-winloss").innerHTML = Math.round(element.wins * 100 / (element.wins + element.losses)) + "% "+element.wins+"W "+element.losses+"L";
        }
        else if (element.queueType === "RANKED_FLEX_SR") {
          document.getElementById("ranked-flex").innerHTML = "Ranked Flex: "+element.tier+" "+element.rank;
          document.getElementById("ranked-flex-lp").innerHTML = element.leaguePoints+" LP";
          document.getElementById("ranked-flex-winloss").innerHTML = Math.round(element.wins * 100 / (element.wins + element.losses)) + "%" + element.wins+"W "+element.losses+"L"; 
          document.getElementById("ranked-flex-winrate").innerHTML = "Winrate: "+Math.round(element.wins * 100 / (element.wins + element.losses)) + "%";
        }
      })
    })
}

function addToHistory( region, name ) {  
  let inputAccount = {
    region: region,
    name: name
  };

  if (localStorage.getItem('searchHistory') === null) {
    firstInput = {
      accounts: [inputAccount]
    };
    localStorage.setItem('searchHistory', JSON.stringify(firstInput));
  }
  else {
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') );
    searchHistory.accounts.unshift(inputAccount);
    // line is not working correctly
    // searchHistory.accounts = [...new Set(searchHistory.accounts)];
    if (searchHistory.accounts.length > 10) {
      searchHistory.accounts.pop();
    }
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  } 
}




/*
var searchHistory = { 
  accounts: [{
    id: 'Greysi', region: 'na1'
  }]
};
var devkey;
localStorage.setItem('searchHistory', JSON.stringify(searchHistory));

let keyRequest = new Request("./dev-key.json");

fetch(keyRequest)
  .then(response => response.json())
  .then(data => devkey = data.devkey)

function queryAccount(queryRegion,queryName) {
  // lookup account in api, if found:
  // add to search history
  // add to html list
  // send user to the account-main page
  


  // add account to front of search history, remove duplicates, max length of 10
  searchHistory = JSON.parse(localStorage.getItem('searchHistory'));
  let test1 = queryName;
  let test2 = queryRegion
  let inputAccount = {
      id: queryName.value,
      region: queryRegion.value
    };
  searchHistory.accounts.unshift(inputAccount);
  searchHistory.accounts = [...new Set(searchHistory.accounts)];
  console.log(searchHistory.accounts.length);
  console.log(searchHistory);
  if(searchHistory.accounts.length > 10) {
    searchHistory.accounts.pop();
  }
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  /*
  searchHistory.unshift(name.value);
  searchHistory = [...new Set(searchHistory)];
  if (searchHistory.length > 10) {
    searchHistory.pop();
  }
  

  // show search history in unordered list 
  let list = document.getElementById("recent");
  list.innerHTML="";
  searchHistory.forEach((acc)=>{
    let li = document.createElement('li');
    li.innerText = acc;
    list.appendChild(li);
  })
  

  // send user to the account-main page

  

} 
*/