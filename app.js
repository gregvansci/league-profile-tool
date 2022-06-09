/* Javascript to be built alongside html as needed. */

// use session storage to get data between pages
// session storage will hold: recent searches, current account info, current account region

var devkey;
var returnStatus;

function initIndex() {
  getDevKey("./dev-key.json");
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

function containsSpecialChars(str) {
  const specialCharacters = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return specialCharacters.test(str);
}

function checkValitidy( queryRegion, queryName ) {
  // check for special characters
  if (!containsSpecialChars( queryName.value ) && queryName.value.length >= 3 && queryName.value.length <= 16 ) {
    // go to account page
    window.location = ( './summoner/profile.html?region=' + queryRegion.value + '&name=' + queryName.value);
  }
}

function getParameter ( parameterName ) {
  let parameters = new URLSearchParams( window.location.search );
  return parameters.get( parameterName );
}

function translateRegion ( regionInput ) {
  if ( regionInput == "na" )
    return "na1";
  else if ( regionInput == "euw" )
    return "euw1";
  else if ( regionInput == "kr") 
    return "kr";
}

function goHome() {
  window.location = ("../");
}

function searchAccount() {
  // get parameters
  let region = translateRegion(getParameter("region"));
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
      
      document.getElementById("profile-icon").src = 'http://ddragon.leagueoflegends.com/cdn/12.11.1/img/profileicon/'+data.profileIconId+'.png';  
      document.getElementById("summoner-level").innerHTML = "Level: "+data.summonerLevel;
      document.getElementById("profile-name").innerHTML = data.name;
    })
}

function fetchEntriesBySummoner( region, name) {

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