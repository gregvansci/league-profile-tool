/* Javascript to be built alongside html as needed. */

// use session storage to get data between pages
// session storage will hold: recent searches, current account info, current account region


function containsSpecialChars(str) {
  const specialCharacters = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
  return specialCharacters.test(str);
}

function checkValitidy( queryRegion, queryName ) {
  // check for special characters
  if (!containsSpecialChars( queryName.value ) && queryName.value.length >= 3 && queryName.value.length <= 16 ) {
    // go to account page
    window.location = ( "./summoner/profile.html?region=" + queryRegion.value + "&name=" + queryName.value);
  }
}

function getParameter ( parameterName ) {
  let parameters = new URLSearchParams( window.location.search );
  return parameters.get( parameterName );
}

function searchAccount() {
  // get url parameters
  // use parameters to lookup account in riot api
  // 
  let region = getParameter("region");
  let name = getParameter("name");
  
  

  addToHistory( region, name);
  
}

function addToHistory( region, name ) {
  //sessionStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  
  let searchHistory = {};
  let inputAccount = {
    id: region,
    region: name
  };
  searchHistory.accounts.unshift(inputAccount);
}




/*
var searchHistory = { 
  accounts: [{
    id: 'Greysi', region: 'na1'
  }]
};
var devkey;
sessionStorage.setItem('searchHistory', JSON.stringify(searchHistory));

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
  searchHistory = JSON.parse(sessionStorage.getItem('searchHistory'));
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
  sessionStorage.setItem('searchHistory', JSON.stringify(searchHistory));
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