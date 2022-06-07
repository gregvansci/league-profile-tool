/* Javascript to be built alongside html as needed. */

// use session storage to get data between pages
// session storage will hold: recent searches, current account info, current account region


function searchAccount(queryRegion, queryAccount) {
  // check if name has special characters
  // if yes, do nothing
  // if no, go to summoner page
  // /summoners/na/Greysi
  

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