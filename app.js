/* Javascript to be built alongside html as needed. */
var searchHistory = [];

function queryAccount(region,name) {
  // lookup account in api, if found:
  // add to search history
  // add to html list
  // send user to the account-main page


  // add account to front of search history, remove duplicates, max length of 10
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