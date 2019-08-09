// global currentUser variable
let currentUser = null;

$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $myStoriesButton = $("#nav-my-stories");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $navSubmit = $("#nav-submit");

  // global storyList variable
  let storyList = null;



  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successful we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
    $(".main-nav-links").toggleClass("hidden");
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Clicking Sumbit
   */

  $navSubmit.on("click", function () {
    $submitForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Submitting New Article
   */
  $submitForm.on("submit", async function () {
    let newStoryObj = {
      author: $("#author").val(),
      title: $("#title").val(),
      url: $("#url").val()
    }
    await storyList.addStory(currentUser, newStoryObj);
    generateStories();
    currentUser.ownStories.push(newStoryObj);
    $submitForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();
    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <i class="${loopFavorites(currentUser, story)} fa-star"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }


  //generate my stories

  function generateMyStoriesHTML(story) {
    let hostName = getHostName(story.url);
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="fas fa-trash"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }
  
  function generateFavoritesHTML(story) {
    let hostName = getHostName(story.url);
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="fas fa-star"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }
  // /* click listener on stars */
  // if(currentUser !== null) {
  //   $(".star").on("click", favoriteArticle);
  // };

  $allStoriesList.on("click", ".fa-star", function(evt){
    favoriteArticle(evt);
  });

  /*  Creating the click function for the favorite  */
  async function favoriteArticle(evt) {
    let storyId = $(evt.target).parent().attr('id');
    $(evt.target).toggleClass("far fas");
    if ($(evt.target).hasClass("fas")) {
      await currentUser.addFavorite(currentUser, storyId);
    } else {
      await currentUser.removeFavorite(currentUser, storyId);
    }
  }
  // removing articles we created
  $allStoriesList.on("click", ".fa-trash", function(evt){
    currentUser.deleteArticle($(evt.target).parent().attr("id"));
    $(evt.target).parent().remove();
  });



  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $(".main-nav-links").show();
    $navLogin.hide();
    $navLogOut.show();
    if ($(".star").hasClass("hidden")) {
      $(".star").removeClass("hidden");
    }
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }

/* click and show favorites */
$("#nav-favorites").on("click", generateFavs);

/* Generate favorite stories function */
function generateFavs() {
  // get an instance of StoryList
  const favoriteStoryListInstance = currentUser.favorites;
  // update our global variable
  favoriteList = favoriteStoryListInstance;
  // empty out that part of the page
  $allStoriesList.empty();
  // loop through all of our stories and generate HTML for them
  for (let story of favoriteList) {
    const result = generateFavoritesHTML(story);
    $allStoriesList.append(result);
  }
}


//adding my stories to the DOM
$myStoriesButton.on("click", function() {
  $allStoriesList.empty();
  for(let myStory of currentUser.ownStories){
    const result = generateMyStoriesHTML(myStory);
    $allStoriesList.append(result);
  }
});


});

function loopFavorites(user, story) {
  if (user === null) {
    return "far"
  } else {
    for (let i = 0; i < user.favorites.length; i++) {
      if (user.favorites[i].storyId === story.storyId) {
        return "fas";
      }
    }
  }
  return "far";
}

function starCheck(user) {
  if (user === null) {
    return "hidden";
  }
  return;
}


