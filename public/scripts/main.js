/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

let groups = [];
let a = [];
let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function signIn() {
    // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
    // firebase.auth().signInWithPopup(provider).then(function () {
    //     initGroupsList().then(function () {
    //         initContactsList()
    //     })
    // });

}

function signOut() {
    // Sign out of Firebase.
    firebase.auth().signOut();
}

// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
    return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
    return firebase.auth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
    return !!firebase.auth().currentUser;
}

// // Loads chat messages history and listens for upcoming ones.
// function loadMessages() {
//   // Loads the last 12 messages and listen for new ones.
//   var callback = function(snap) {
//     var data = snap.val();
//     console.log(data);
//     displayMessage(snap.key, data.name, data.text, data.profilePicUrl, data.imageUrl);
//   };

//   firebase.database().ref('/messages/').limitToLast(12).on('child_added', callback);
//   firebase.database().ref('/messages/').limitToLast(12).on('child_changed', callback);
// }

// // Saves a new message on the Firebase DB.
// function saveMessage(messageText) {
//   // Add a new message entry to the Firebase Database.
//   return firebase.database().ref('/messages/').push({
//     name: getUserName(),
//     text: messageText,
//     profilePicUrl: getProfilePicUrl()
//   }).catch(function(error) {
//     console.error('Error writing new message to Firebase Database', error);
//   });
// }

// // Saves a new message containing an image in Firebase.
// // This first saves the image in Firebase storage.
// function saveImageMessage(file) {
//   // 1 - We add a message with a loading icon that will get updated with the shared image.
//   firebase.database().ref('/messages/').push({
//     name: getUserName(),
//     imageUrl: LOADING_IMAGE_URL,
//     profilePicUrl: getProfilePicUrl()
//   }).then(function(messageRef) {
//     // 2 - Upload the image to Cloud Storage.
//     var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
//     return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
//       // 3 - Generate a public URL for the file.
//       return fileSnapshot.ref.getDownloadURL().then((url) => {
//         // 4 - Update the chat message placeholder with the image's URL.
//         return messageRef.update({
//           imageUrl: url,
//           storageUri: fileSnapshot.metadata.fullPath
//         });
//       });
//     });
//   }).catch(function(error) {
//     console.error('There was an error uploading a file to Cloud Storage:', error);
//   });
// }

// Saves the messaging device token to the datastore.
function saveMessagingDeviceToken() {
    firebase.messaging().getToken().then(function (currentToken) {
        if (currentToken) {
            console.log('Got FCM device token:', currentToken);
            // Saving the Device Token to the datastore.
            firebase.database().ref('/fcmTokens').child(currentToken)
                .set(firebase.auth().currentUser.uid);
        } else {
            // Need to request permissions to show notifications.
            requestNotificationsPermissions();
        }
    }).catch(function (error) {
        console.error('Unable to get messaging token.', error);
    });
}

// Requests permissions to show notifications.
function requestNotificationsPermissions() {
    console.log('Requesting notifications permission...');
    firebase.messaging().requestPermission().then(function () {
        // Notification permission granted.
        saveMessagingDeviceToken();
    }).catch(function (error) {
        console.error('Unable to get permission to notify.', error);
    });
}

// Triggered when a file is selected via the media picker.
function onMediaFileSelected(event) {
    event.preventDefault();
    var file = event.target.files[0];

    // Clear the selection in the file picker input.
    imageFormElement.reset();

    // Check if the file is an image.
    if (!file.type.match('image.*')) {
        // var data = {
        //     message: 'You can only share images',
        //     timeout: 2000
        // };
        // messageSnackbarElement.MaterialSnackbar.showSnackbar(data);
        showSnackbar('You can only share images');
        return;
    }
    // Check if the user is signed-in
    if (checkSignedInWithMessage()) {
        saveImageMessage(file);
    }
}

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
    e.preventDefault();
    // Check that the user entered a message and is signed in.
    if (messageInputElement.value && checkSignedInWithMessage()) {
        saveMessage(messageInputElement.value);
        // saveMessage(messageInputElement.value).then(function() {
        //   // Clear message text field and re-enable the SEND button.
        //   resetMaterialTextfield(messageInputElement);
        //   toggleButton();
        // });
    }
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
async function authStateObserver(user) {
    if (user) { // User is signed in!


        firebase.database().ref("users_reg/" + firebase.auth().currentUser.uid).once("value").then(function (snap) {
            if (!snap.val()) {
                console.log("new user");
                $("#username-modal").modal({
                    backdrop: "static",
                    keyboard: false
                });
            }
            else{
                firebase.auth().currentUser.nickname = snap.val().nickname;
            }
        }).then(function(){
            initGroupsList().then(function () {
                initMainEventListeners();
                initContactsList();

                
                $(".contact").click(function () {
                    console.log("kontakt kliknut");
                    $("#contact-name").removeAttr("hidden");
                    $("#contact-name").text($(this).find("b:first").text());
                    loadMessages();
                });
            });
            
        });

        //B.Š. - initialize contacts only when the auth controller is initialised and user is logged in
        

        // Get the signed-in user's profile pic and name.
        var profilePicUrl = getProfilePicUrl();
        var userName = getUserName();

        // Set the user's profile pic and name.
        userPicElement.style.backgroundImage = 'url(' + profilePicUrl + ')';
        userNameElement.textContent = userName;

        // Show user's profile and sign-out button.
        userNameElement.removeAttribute('hidden');
        userPicElement.removeAttribute('hidden');
        signOutButtonElement.removeAttribute('hidden');

        // Hide sign-in button.
        signInButtonElement.setAttribute('hidden', 'true');

        $("#main").show()
        // We save the Firebase Messaging Device token and enable notifications.
        //saveMessagingDeviceToken();

    }

    else { // User is signed out!

        contactsListElement.innerHTML = "";

        // Hide user's profile and sign-out button.
        userNameElement.setAttribute('hidden', 'true');
        userPicElement.setAttribute('hidden', 'true');
        signOutButtonElement.setAttribute('hidden', 'true');

        // Show sign-in button.
        signInButtonElement.removeAttribute('hidden');

        $("#main").hide();
    }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
    // Return true if the user is signed in Firebase
    if (isUserSignedIn()) {
        return true;
    }

    // Display a message to the user using a Toast.
    // var data = {
    //     message: 'You must sign-in first',
    //     timeout: 2000
    // };
    // messageSnackbarElement.MaterialSnackbar.showSnackbar(data);
    showSnackbar("You must sign-in first");
    return false;
}

// Resets the given MaterialTextField.
//TODO: PREIMENOVATI
function resetMaterialTextfield(element) {
    element.value = '';
    element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

// Template for messages.
var MESSAGE_TEMPLATE =
    '<div class="message-container">' +
    '<div class="spacing"><div class="pic"></div></div>' +
    '<div class="message"></div>' +
    '<div class="name"></div>' +
    //'<div class="date"></div>' +
    '</div>';

// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Displays a Message in the UI.
function displayMessage(key, name, text, timestamp, picUrl, imageUrl) {
    // var div = document.getElementById(key);
    var div = document.getElementById(key);
    var date = new Date(timestamp);
    // If an element for that message does not exist yet we create it.
    if (!div) {
        var container = document.createElement('div');
        container.innerHTML = MESSAGE_TEMPLATE;
        div = container.firstChild;
        div.setAttribute('id', key);
        if (name == firebase.auth().currentUser.email) {
            div.style.backgroundColor = "#eaf2ff";
        }
        messageListElement.appendChild(div);
    }
    if (picUrl) {
        div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
    }
    div.querySelector('.name').textContent = name;
    //div.querySelector('.date').textContent = date.getDate() + " " + months[date.getMonth()]+" "+date.getFullYear()+" "+ date.getHours()+":"+date.getMinutes();
    if (name == firebase.auth().currentUser.email) {
        div.style.backgroundColor = "#EAF2FF";
    }
    var messageElement = div.querySelector('.message');
    if (text) { // If the message is text.
        messageElement.textContent = text;
        // Replace all line breaks by <br>.
        messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
    } else if (imageUrl) { // If the message is an image.
        var image = document.createElement('img');
        image.addEventListener('load', function () {
            messageListElement.scrollTop = messageListElement.scrollHeight;
        });
        image.src = imageUrl + '&' + new Date().getTime();
        messageElement.innerHTML = '';
        messageElement.appendChild(image);
    }
    // Show the card fading-in and scroll to view the new message.
    setTimeout(function () { div.classList.add('visible') }, 1);
    messageListElement.scrollTop = messageListElement.scrollHeight;
    messageInputElement.focus();
}

// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
    if (messageInputElement.value) {
        submitButtonElement.removeAttribute('disabled');
    } else {
        submitButtonElement.setAttribute('disabled', 'true');
    }
}

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
    if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
        window.alert('You have not configured and imported the Firebase SDK. ' +
            'Make sure you go through the codelab setup instructions and make ' +
            'sure you are running the codelab using `firebase serve`');
    }
}

// Checks that Firebase has been imported.
checkSetup();

// Shortcuts to DOM Elements.
var messageListElement = document.getElementById('messages');
var messageFormElement = document.getElementById('message-form');
var messageInputElement = document.getElementById('message');
var submitButtonElement = document.getElementById('msg-submit-btn');
var imageButtonElement = document.getElementById('submitImage');
var imageFormElement = document.getElementById('image-form');
var mediaCaptureElement = document.getElementById('mediaCapture');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var messageSnackbarElement = document.getElementById('alert-snackbar');

var contactsListElement = document.getElementById('contacts');


// Saves message on form submit.
messageFormElement.addEventListener('submit', onMessageFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

// Toggle for the button.
messageInputElement.addEventListener('keyup', toggleButton);
messageInputElement.addEventListener('change', toggleButton);

// Events for image upload.
imageButtonElement.addEventListener('click', function (e) {
    e.preventDefault();
    mediaCaptureElement.click();
});
mediaCaptureElement.addEventListener('change', onMediaFileSelected);

// initialize Firebase
initFirebaseAuth();

//---------------------------------------------------------------------------------------------------

//TODO: naci drugi nacin doohvacanja grupa u kojima je korisnik



function snapshotToArray(snapshot) {
    var returnArr = [];

    snapshot.forEach(function (childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;

        returnArr.push(item);
    });

    return returnArr;
};


async function initGroupsList() {
    return firebase.database().ref("groups").on("value", function (snap) {
        groups = [];  //Potrebno, jer ce se u suprotnom grupe dvaput ucitati u listu kontakata
        if(snap.exists()){
            snap.forEach((a) => {
                a.val().participants.forEach((p) => {
                    if (p == firebase.auth().currentUser.nickname) {
                        groups.push(a.val());
                    }
                });
            });
        }
    });
}


function initContactsList() {
    //console.log("Inicijalizacija kontakata");
    var contacts = [];
    contactsListElement.innerHTML = "";


    firebase.database().ref("latest/" + firebase.auth().currentUser.nickname).orderByChild("latestMessageTimestamp").once("value", function (snap) {
        //console.log(snap.val());
        snap.forEach(function (childSnap) {
            //console.log(childSnap.val());
            contacts.push(childSnap.val());
        });

        groups.forEach(function (group) {
            var temp = group;
            temp.convoPartner = group.displayName;
            //delete temp.displayName;
            contacts.push(temp);

        });

        //console.log(groups);
        
        //console.log(contacts);
    }).then(function () {
        
        contacts = sortContacts(contacts);
        console.log(contacts);
        
        contactsListElement.innerHTML = "";
        for (let i = 0; i < contacts.length; i++) {
            if("participants" in contacts[i]){
                firebase.database().ref(`groups/${contacts[i]["convoPartner"]}/profilePic`).once("value", function(snapshot){
                    var contactsToAdd = `<div class='col-sm-3'><img src= ${snapshot.val()}  /></div><div class = 'col-sm-9'<p><b> ${contacts[i]["convoPartner"]}</b></p><p> ${contacts[i]["latestMessage"]}</p></div>`;
                    var contactDiv = document.createElement("div");
                    contactDiv.className = "contact row"
                    contactDiv.innerHTML = contactsToAdd;
                    document.getElementById("contacts").appendChild(contactDiv);

                    $(".contact").off();
                    $(".contact").on("click", function () {
                        $("#contact-name").removeAttr("hidden");
                        $("#contact-name").text($(this).find("b:first").text());
                        loadMessages();
                    });

                });
            }
            
            else{
                firebase.database().ref("users/" + contacts[i]["convoPartner"] + "/profilePic").once("value").then(function (snapshot) {                
                    //console.log(contacts[i]["convoPartner"]);
                    //var contactsToAdd = "<div class='col-sm-3'><img src =" + snapshot.val().profilePic + " /></div><div class = 'col-sm-9'<p><b>" + contacts[i].convoPartner + "</b></p><p>" + contacts[i].latestMessage + "</p></div>";
                    var contactsToAdd = `<div class='col-sm-3'><img src= ${snapshot.val()}  /></div><div class = 'col-sm-9'<p><b> ${contacts[i]["convoPartner"]}</b></p><p> ${contacts[i]["latestMessage"]}</p></div>`;
                    var contactDiv = document.createElement("div");
                    contactDiv.className = "contact row"
                    contactDiv.innerHTML = contactsToAdd;
                    document.getElementById("contacts").appendChild(contactDiv);
                    
                    //B.Š. - events need to be assigned inside the database callback function, otherwise they're assigned before the DB call is finished.
                    $(".contact").off();
                    $(".contact").on("click", function () {
                        $("#contact-name").removeAttr("hidden");
                        $("#contact-name").text($(this).find("b:first").text());
                        loadMessages();
                    });
    
                });
            }
            
            //wat
            //var contactsToAdd = "<p><b>" + contacts[i].convoPartner + "</b></p><p>" + contacts[i].latestMessage + "</p>"; //the fuck is this
            
        }   

        
      
        

        
    }).then(function(){

        

    });
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {

    messageListElement.innerHTML = '<span id="message-filler"></span>';

    //B.Š. - callback function called every time message data is modified and returned from DB 
    var msgCallback = function (snap) {
        var data = snap.val();
        //console.log(data);
        initContactsList();  // B.Š. - refresh contacts list when a message is sent or received. 
        displayMessage(snap.key, data.sender, data.content, data.timestamp, data.profilePic, data.imageUrl);
    };

    firebase.database().ref("users").orderByKey().equalTo($("#contact-name").text()).on("value", function (snapshot) {
        if (snapshot.exists()) {

            firebase.database().ref("users").orderByKey().equalTo($("#contact-name").text()).on("child_added", function (snapshot) {
                var secondUserNickname = $("#contact-name").text();
                firebase.database().ref("chats").once("value").then(function (snapshot) {
                    if (snapshot.hasChild(firebase.auth().currentUser.nickname + "_" + secondUserNickname)) {
                        firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname + "/messages").on("child_added", msgCallback);
                        firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname + "/messages").on("child_changed", msgCallback);
                    }
                    else if (snapshot.hasChild(secondUserUid + "_" + firebase.auth().currentUser.uid)) {
                        firebase.database().ref("chats/" + secondUserNickname + "_" + firebase.auth().currentUser.nickname + "/messages").on("child_added", msgCallback);
                        firebase.database().ref("chats/" + secondUserNickname + "_" + firebase.auth().currentUser.nickname + "/messages").on("child_changed", msgCallback);
                    }

                });
            });
        }
        else {
            firebase.database().ref("chats/" + $("#contact-name").text() + "/messages").on("child_added", msgCallback);
            firebase.database().ref("chats/" + $("#contact-name").text() + "/messages").on("child_changed", msgCallback);
        }
    });

}

function saveMessage(msgText) {
    var secondUserNickname = $("#contact-name").text();
    if (secondUserNickname == "") {
        // var data = {
        //     message: "Please select a contact first",
        //     timeout: 2000
        // }
        // messageSnackbarElement.MaterialSnackbar.showSnackbar(data);
        showSnackbar("Please select a contact first");
        return;
    }

    else {
        firebase.database().ref("users").orderByKey().equalTo(secondUserNickname).on("value", function (snapshot) {

            //INDIVIDUAL CHATS
            if (snapshot.exists()) {
                firebase.database().ref("users").orderByKey().equalTo(secondUserNickname).once("child_added", function () {

                    firebase.database().ref("chats").once("value").then(function (snapshot) {
                        //  B.Š. - check if conversations already exist, if not, create a new convo. 
                        //  Checks for nickname1_nickname2, nickname2_nickname1 convo names.

                        if (snapshot.hasChild(firebase.auth().currentUser.nickname + "_" + secondUserNickname)) {
                            firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).update({
                                participants: [firebase.auth().currentUser.nickname, secondUserNickname],
                                latestMessage: + new Date(),
                                message: msgText,
                                sender: firebase.auth().currentUser.nickname,
                                groupChat: false
                            }).then(function () {
                                resetMaterialTextfield(messageInputElement); //TODO: preimenovati
                                toggleButton();
                                firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname + "/messages").push({
                                    type: "text",
                                    content: msgText,
                                    sender: firebase.auth().currentUser.nickname,
                                    timestamp: + new Date(),
                                    profilePic: firebase.auth().currentUser.photoURL
                                });
                            });
                            firebase.database().ref("latest/" + firebase.auth().currentUser.nickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                latestMessage: msgText,
                                latestMessageSender: firebase.auth().currentUser.nickname,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: secondUserNickname,
                                type: "text"
                            });
                            firebase.database().ref("latest/" + secondUserNickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                latestMessage: msgText,
                                latestMessageSender: firebase.auth().currentUser.email,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: firebase.auth().currentUser.email,
                                type: "text"
                            });

                        }
                        else if (snapshot.hasChild(secondUserNickname + "_" + firebase.auth().currentUser.nickname)) {
                            firebase.database().ref("chats/" + secondUserNickname + "_" + firebase.auth().currentUser.nickname).update({
                                participants: [firebase.auth().currentUser.nickname, secondUserNickname],
                                latestMessage: + new Date(),
                                message: msgText,
                                sender: firebase.auth().currentUser.nickname,
                                groupChat: false,
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function () {
                                resetMaterialTextfield(messageInputElement);
                                toggleButton();
                                firebase.database().ref("chats/" + secondUserNickname + "_" + firebase.auth().currentUser.nickname + "/messages").push({
                                    type: "text",
                                    content: msgText,
                                    sender: firebase.auth().currentUser.nickname,
                                    timestamp: + new Date()
                                });
                            });
                            firebase.database().ref("latest/" + firebase.auth().currentUser.nickname + "/" + secondUserNickname + "_" + firebase.auth().currentUser.nickname).set({
                                latestMessage: msgText,
                                latestMessageSender: firebase.auth().currentUser.nickname,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: secondUserNickname,
                                type: "text"
                            });
                            firebase.database().ref("latest/" + secondUserNickname + "/" + secondUserNickname + "_" + firebase.auth().currentUser.nickname).set({
                                latestMessage: msgText,
                                latestMessageSender: firebase.auth().currentUser.nickname,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: firebase.auth().currentUser.email,
                                //convoPartner: secondUserNickname,
                                type: "text"
                            });
                        }
                        else {
                            firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                participants: [firebase.auth().currentUser.nickname, secondUserNickname],
                                latestMessage: + new Date(),
                                message: msgText,
                                latestMessageSender: firebase.auth().currentUser.nickname,
                                groupChat: false,
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function () {
                                resetMaterialTextfield(messageInputElement);
                                toggleButton();

                                firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname + "/messages").push({
                                    type: "text",
                                    content: msgText,
                                    sender: firebase.auth().currentUser.nickname,
                                    timestamp: + new Date()
                                });
                            });
                            firebase.database().ref("latest/" + firebase.auth().currentUser.nickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                latestMessage: msgText,
                                latestMessageSender: firebase.auth().currentUser.nickname,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: secondUserNickname,
                                type: "text"
                            });
                            firebase.database().ref("latest/" + secondUserNickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                latestMessage: msgText,
                                latestMessageSender: firebase.auth().currentUser.nickname,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: firebase.auth().currentUser.nickname,
                                type: "text"
                            });
                        }
                    });
                })
            }

            //GROUP CHATS
            else {
                firebase.database().ref("chats/" + secondUserNickname).update({  //B.Š. - nickname is the group name in this case
                    latestMessage: + new Date(),
                    latestMessageSender: firebase.auth().currentUser.nickname,
                    latestMessage: msgText,
                    // profilePic: firebase.auth().currentUser.profilePicUrl,   
                    profilePic: "https://cdn-images-1.medium.com/max/1200/1*MccriYX-ciBniUzRKAUsAw.png", //temp profilna za grupe
                }).then(function () {
                    resetMaterialTextfield(messageInputElement);
                    toggleButton();

                    firebase.database().ref("chats/" + $("#contact-name").text() + "/messages").push({
                        content: msgText,
                        sender: firebase.auth().currentUser.nickname,
                        type: "text",
                        profilePic: firebase.auth().currentUser.photoURL,

                    })
                });

                firebase.database().ref("groups/" + secondUserNickname).update({
                    latestMessageTimestamp: + new Date(),
                    latestMessageSender: firebase.auth().currentUser.nickname,
                    latestMessage: msgText,
                    profilePic: firebase.auth().currentUser.photoURL,
                });



                //TODO: napraviti Cloud Funkciju da svim clanovima grupe u latest stavi grupa/poruke
                // staviti kao trigger kada se updatea grupa s najnovijim porukama ili kada dode poruka u grupu

                firebase.database().ref("latest/" + secondUserNickname).update({
                    latestMessage: msgText,
                    latestMessageSender: firebase.auth().currentUser.nickname,
                    latestMessageTimestamp: + new Date(),
                    latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                    type: "text"
                });
            }
        });
        return;
    }
}


//ODAVDE NASTAVITI
function saveImageMessage(file) {
    var secondUserNickname = $("#contact-name").text();

    firebase.database().ref("users").orderByKey().equalTo(secondUserNickname).on("value", function (snapshot) {
        if (snapshot.exists()) {
            firebase.database().ref("users").orderByKey().equalTo(secondUserNickname).once("child_added", function (snapshot) {
                //var secondUserUid = snapshot.val().uid;
                firebase.database().ref("chats").once("value").then(function (snapshot) {
                    if (snapshot.hasChild(firebase.auth().currentUser.nickname + "_" + secondUserNickname)) {
                        firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).update({
                            participants: [firebase.auth().currentUser.nickname, secondUserNickname],
                            latestMessage: + new Date(),
                            message: "Image",
                            sender: firebase.auth().currentUser.nickname,
                            groupChat: false,
                            type: "image"
                        }).then(function () {

                            firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname + "/messages").push({
                                type: "text",
                                imageUrl: LOADING_IMAGE_URL,
                                sender: firebase.auth().currentUser.nickname,
                                timestamp: + new Date(),
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function (messageRef) {
                                var filePath = firebase.auth().currentUser.nickname + '/' + messageRef.key + '/' + file.name;
                                return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
                                    // Generate a public URL for the file.
                                    return fileSnapshot.ref.getDownloadURL().then((url) => {
                                        // Update the chat message placeholder with the image's URL.
                                        return messageRef.update({
                                            imageUrl: url,
                                            storageUri: fileSnapshot.metadata.fullPath
                                        }).then(function () {
                                            firebase.database().ref("latest/" + firebase.auth().currentUser.nickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                                latestMessage: "",
                                                latestMessageSender: firebase.auth().currentUser.nickname,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: secondUserNickname,
                                                type: "image"
                                            });
                                            firebase.database().ref("latest/" + secondUserNickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                                latestMessage: "",
                                                latestMessageSender: firebase.auth().currentUser.nickname,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: firebase.auth().currentUser.nickname,
                                                type: "image"
                                            });
                                        });
                                    });
                                });
                            });
                        });

                    }
                    else if (snapshot.hasChild(secondUserNickname + "_" + firebase.auth().currentUser.nickname)) {
                        firebase.database().ref("chats/" + secondUserNickname + "_" + firebase.auth().currentUser.nickname).update({
                            participants: [secondUserNickname, firebase.auth().currentUser.nickname],
                            latestMessage: + new Date(),
                            message: "Image",
                            sender: firebase.auth().currentUser.nickname,
                            groupChat: false,
                            type: "image"
                        }).then(function () {
                            firebase.database().ref("chats/" + secondUserNickname + "_" + firebase.auth().currentUser.nickname + "/messages").push({
                                type: "text",
                                imageUrl: LOADING_IMAGE_URL,
                                sender: firebase.auth().currentUser.nickname,
                                timestamp: + new Date(),
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function (messageRef) {
                                var filePath = firebase.auth().currentUser.nickname + '/' + messageRef.key + '/' + file.name;
                                return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
                                    // Generate a public URL for the file.
                                    return fileSnapshot.ref.getDownloadURL().then((url) => {
                                        // Update the chat message placeholder with the image's URL.
                                        return messageRef.update({
                                            imageUrl: url,
                                            storageUri: fileSnapshot.metadata.fullPath
                                        }).then(function () {
                                            firebase.database().ref("latest/" + firebase.auth().currentUser.nickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                                latestMessage: "",
                                                latestMessageSender: firebase.auth().currentUser.nickname,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: secondUserNickname,
                                                type: "image"
                                            });
                                            firebase.database().ref("latest/" + secondUserNickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                                latestMessage: "",
                                                latestMessageSender: firebase.auth().currentUser.nickname,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: firebase.auth().currentUser.nickname,
                                                type: "image"
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }
                    else {
                        firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                            participants: [firebase.auth().currentUser.nickname, secondUserNickname],
                            latestMessage: + new Date(),
                            message: "Image",
                            sender: firebase.auth().currentUser.nickname,
                            groupChat: false,
                            type: "image"
                        }).then(function () {

                            firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname + "/messages").push({
                                type: "text",
                                imageUrl: LOADING_IMAGE_URL,
                                sender: firebase.auth().currentUser.nickname,
                                timestamp: + new Date(),
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function (messageRef) {
                                var filePath = firebase.auth().currentUser.nickname + '/' + messageRef.key + '/' + file.name;
                                return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
                                    // Generate a public URL for the file.
                                    return fileSnapshot.ref.getDownloadURL().then((url) => {
                                        // Update the chat message placeholder with the image's URL.
                                        return messageRef.update({
                                            imageUrl: url,
                                            storageUri: fileSnapshot.metadata.fullPath
                                        }).then(function () {
                                            firebase.database().ref("latest/" + firebase.auth().currentUser.nickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                                latestMessage: "",
                                                latestMessageSender: firebase.auth().currentUser.nickname,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: secondUserNickname,
                                                type: "image"
                                            });
                                            firebase.database().ref("latest/" + secondUserNickname + "/" + firebase.auth().currentUser.nickname + "_" + secondUserNickname).set({
                                                latestMessage: "",
                                                latestMessageSender: firebase.auth().currentUser.nickname,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: firebase.auth().currentUser.nickname,
                                                type: "image"
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }
                });
            })
        }

        else {
            firebase.database().ref("chats/" + secondUserNickname).update({
                participants: [firebase.auth().currentUser.nickname, secondUserNickname],
                latestMessage: + new Date(),
                message: "Image",
                sender: firebase.auth().currentUser.nickname,
                groupChat: true,
                type: "image"
            }).then(function () {

                firebase.database().ref("chats/" + secondUserNickname + "/messages").push({
                    type: "text",
                    imageUrl: LOADING_IMAGE_URL,
                    sender: firebase.auth().currentUser.nickname,
                    timestamp: + new Date(),
                    profilePic: firebase.auth().currentUser.photoURL
                }).then(function (messageRef) {
                    var filePath = firebase.auth().currentUser.nickname + '/' + messageRef.key + '/' + file.name;
                    return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
                        // Generate a public URL for the file.
                        return fileSnapshot.ref.getDownloadURL().then((url) => {
                            // Update the chat message placeholder with the image's URL.
                            return messageRef.update({
                                imageUrl: url,
                                storageUri: fileSnapshot.metadata.fullPath
                            }).then(function () {
                                firebase.database().ref("latest/" + $("#contact-name").text()).update({
                                    latestMessage: "",
                                    latestMessageSender: firebase.auth().currentUser.nickname,
                                    latestMessageTimestamp: + new Date(),
                                    latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                    type: "image"
                                });
                            });
                        });
                    });
                });
            });
        }
    });
};


function sortContacts(array) {
    var minIndex, temp
    // len = array.length;
    for (var i = 0; i < array.length; i++) {
        minIndex = i;
        for (var j = i + 1; j < array.length; j++) {
            if (array[j].latestMessageTimestamp > array[minIndex].latestMessageTimestamp) {
                minIndex = j;
            }
        }
        temp = array[i];
        array[i] = array[minIndex];
        array[minIndex] = temp;
    }
    return array;
}

function searchUsers(searchString, type) {
    $("#search-result").empty();

    if (type == "contact") {
        if (searchString != "") {
            firebase.database().ref("users/").orderByChild("nickname").startAt(searchString).endAt(searchString + "\uf8ff").once("value", function (snap) {
                if (snap.exists()) {
                    snap.forEach(function (data) {
                        $("#search-result").append("<option value='" + data.val().nickname + "'></option>")

                    });

                }
            });
        }
    }
    else if (type == "group") {
        if (searchString != "") {
            firebase.database().ref("users/").orderByChild("nickname").startAt(searchString).endAt(searchString + "\uf8ff").once("value", function (snap) {
                if (snap.exists()) {
                    $("#group-user-search").empty();
                    snap.forEach(function (data) {
                        $("#group-user-search").append("<option value='" + data.val().nickname + "'></option>")
                        //console.log(data.val().nickname);
                    });
                    //console.log("----------------------------------");            
                }
            });
        }
    }

}

//B.Š. - search users for starting a chat with a single user
$("#user-search").bind("keyup", function (event) {
    if (event.which == 13 && $("#search-result option").length == 1) {
        //$("#search-result option").val(); nesto...
        //console.log($("#search-result option").val());
        createNewIndividualChat($("#search-result option").val());
    }
    $("#search-result").empty();
    searchUsers($(this).val(), "contact");
});

$("#search-result option").bind("click", function (event) {
    createNewIndividualChat($(this).val()).then(function(){
        initGroupsList().then(function(){
            initContactsList();  //TODO: vjerojatno treba prebrikati da se ne bi kontakti 2x ucitvali nakon zapocinjanja novog razgovora
        });
    });
});


/*
B.Š. - search users for adding to list of participants in group chat currently being created, used in group
       chat creation modal window

Doesn't work if 'modal shown' event listener is assigned before window/page content is fully loaded
*/
window.onload = function () {
    $("#group-create-modal").on("shown.bs.modal", function (e) {
        $("#group-member-input").val("");
        $("#group-user-list").val("");
        //$("#group-user-search").empty();
        $("#group-member-input").bind("keyup", function (event) {
            if (event.which == 13 && $("#group-user-search option").length == 1) {
                addToCreateGroupChatModalUserList($("#group-user-search option").val());
            }
            //$("#group-user-search").empty();
            //console.log("lorem ipsum");
            $("#group-user-search").empty();
            searchUsers($("#group-member-input").val(), "group");
        });
        $("#group-user-search option").click(function () {
            console.log($(this.val()));
        });
    });



    $("form").submit(function (event) {
        event.preventDefault();
    });
};




function saveUsername() {
    $("#username-error").attr("hidden", true);
    if ($("#username-input").val() != "") {
        //console.log($("#username-input").val());
        var regex = new RegExp('^[a-zA-Z0-9_-]*$');  //B.Š. - username can only contain alphanumeric characters, dashes and underscores
        if (regex.test($("#username-input").val())) {
            firebase.database().ref("users/").orderByChild("nickname").equalTo($("#username-input").val()).once("value").then(function (snap) {
                if (!snap.val()) {
                    firebase.auth().currentUser.nickname = $("#username-input").val();
                    firebase.database().ref("users/" + firebase.auth().currentUser.nickname).set({
                        email: firebase.auth().currentUser.email,
                        name: firebase.auth().currentUser.displayName,
                        profilePic: firebase.auth().currentUser.photoURL,
                        uid: firebase.auth().currentUser.uid,
                        nickname: $("#username-input").val()
                    });
                    firebase.database().ref("users_reg/" + firebase.auth().currentUser.uid).set({
                        email: firebase.auth().currentUser.email,
                        name: firebase.auth().currentUser.displayName,
                        profilePic: firebase.auth().currentUser.photoURL,
                        uid: firebase.auth().currentUser.uid,
                        nickname: $("#username-input").val()
                    });

                    $("#username-modal").modal("hide");
                    $("#username-input").val("");
                    $("#username-error").attr("hidden", true);
                }
                else {
                    $("#username-error").attr("hidden", false);
                    $("#username-error").text('Username already taken!');

                }
            });
        }
        else {
            $("#username-error").attr("hidden", false);
            $("#username-error").text("Invalid username!  ");
            $("#username-error").append('<i data-toggle="tooltip" class="fas fa-info-circle">Username conditions</i>');
        }

    }
    else {
        $("#username-error").text("Username must not be empty");
    }

}

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

$(document).keypress(function (event) {
    if (event.which == 13 && ($("#username-modal").data('bs.modal') || {})._isShown) {  //if #username-modal Bootstrap modal element is currently shown
        saveUsername();
    }
});

//B.Š. - adds users to list of selected users in modal window for creating group chats
function addToCreateGroupChatModalUserList(nickname) {
    let usrArray = [];
    usrArray = $("#group-user-list").val().split('|||');
    if (usrArray.indexOf(nickname) == -1) {
        usrArray.push(nickname);
        $("#group-user-list").val(usrArray.join('|||'));
    }


    renderGroupUsersList();
}

function deleteFromCreateModalUserList(nickname) {
    console.log(nickname);
    let usrArray = $("#group-user-list").val().split('|||');
    if (usrArray.indexOf(nickname) > -1) {
        usrArray.splice(usrArray.indexOf(nickname), 1);
    }

    $("#group-user-list").val(usrArray.join('|||'));

    renderGroupUsersList();
}


function renderGroupUsersList() {
    $("#ul-user-list").empty();
    let usrArray = $("#group-user-list").val().split('|||');
    for (var i = 0; i < usrArray.length; i++) {
        if (usrArray[i] != "") {
            //let listItem = "<li class='list-group-item'><div class='row'><div class='col-xs-2'><a href='#' class='mr-2' onclick='deleteFromCreateModalUserList(&quot;"+usrArray[i]+"&quot;)'><i class='fas fa-times'></i></a></i></div><div class='col-xs-10'><p class='pb-1'>"+usrArray[i]+"</p></div></div></li>";
            let listItem = `<li class='list-group-item'><div class='row'><div class='col-xs-2'><a href='#' class='mr-2' onclick='deleteFromCreateModalUserList("${usrArray[i]}")'><i class='fas fa-times'></i></a></i></div><div class='col-xs-10'><p class='pb-1'>${usrArray[i]}</p></div></div></li>`;
            $("#ul-user-list").append(listItem);
        }

    }
}

function createGroupChat() {
    $("#group-error").prop("hidden", true);
    if (confirm("Are you sure?")) {
        if ($("#ul-user-list li").length >= 1 && $("#group-name").val() != "") {
            var users = [];
            $("#ul-user-list li").each(function () {
                users.push($(this).text());
            });
            var regex = new RegExp('^[a-zA-Z0-9_ -]*$');
            if (regex.test($("#group-name").val())) {
                firebase.database().ref("groups/").once("value", function (snapshot) {
                    if (snapshot.hasChild($("#group-name").val())) {
                        $("#group-error").prop("hidden", false);
                        $("#group-error").text("Groupp name already used!");
                    }
                    else {
                        var groupName = $("#group-name").val()
                        //TODO: UPLOAD PROFILNE SLIKE ZA GRUPU
                        firebase.database().ref(`groups/${groupName}`).set({
                            displayName: $("#group-name").val(),
                            latestMessage: "",
                            latestMessageSender: "",
                            profilePic: "",
                            latestMessageTimestamp: + new Date(),
                            participants: users
                        }).then(function () {
                            $("#group-error").prop("hidden", true);
                            $('#group-create-modal').modal('hide');
                            initGroupsList().then(function(){
                                initContactsList();
                            });
                        });

                        firebase.database().ref(`latest/${groupName}`).set({
                            convoPartner: groupName,
                            latestMessage: `${firebase.auth().currentUser.nickname} added you to ${groupName}`,
                            latestMessageTimestamp: + new Date(),
                            latestMessageSender: firebase.auth().currentUser.nickname,
                            profilePic: "http://lorempixel.com/output/abstract-q-g-300-300-8.jpg",
                            groupChat: true,
                            type: "alert"
                        });
                        firebase.database().ref(`latest/${groupName}`).update({
                            latestMessageTimestamp: + new Date(),
                        });
                    }
                });
            }
            else {
                $("#group-error").prop("hidden", false);
                $("#group-error").text("Invalid group name!");
            }

        }
        else {
            $("#group-error").prop("hidden", false);
            $("#group-error").text("At least one user is needed!");
        }

    }
}

async function createNewIndividualChat(nickname) {

    firebase.database().ref("chats/").once("value", function (snapshot) {
        if (snapshot.hasChild(nickname + "_" + firebase.auth().currentUser.nickname) || snapshot.hasChild(firebase.auth().currentUser.nickname + "_" + nickname)) {
            //alert("User already added to conversation list!");
            showSnackbar("User already added to conversation list!");
        }
        else {
            console.log(nickname);
            firebase.database().ref("chats/" + firebase.auth().currentUser.nickname + "_" + nickname).set({
                groupChat: false,
                latestMessage: + new Date(),
                latestMessageSender: firebase.auth().currentUser.nickname,
                message: "",
                messages: [],
                participants: [firebase.auth().currentUser.nickname, nickname],
                sender: firebase.auth().currentUser.nickname,
                type: "text"
            })
        }
    });
    
    firebase.database().ref(`latest/${firebase.auth().currentUser.nickname}/${firebase.auth().currentUser.nickname}_${nickname}`).set({
        convoPartner: nickname,
        latestMessage: `You started a chat with ${nickname}.`,
        latestMessageSender: firebase.auth().currentUser.nickname,
        latestMessageTimestamp: + new Date(),
        latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
        type: "text"
    });
    firebase.database().ref(`latest/${nickname}/${firebase.auth().currentUser.nickname}_${nickname}`).set({
        convoPartner: firebase.auth().currentUser.nickname,
        latestMessage: `${firebase.auth().currentUser.nickname} wants to talk.`,
        latestMessageSender: firebase.auth().currentUser.nickname,
        latestMessageTimestamp: + new Date(),
        latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
        type: "text"
    });


    //B.Š. - used to trigger "child_changed" event listener on the latest messages node, and reinitialize the contacts list

    firebase.database().ref(`latest/${firebase.auth().currentUser.nickname}/${firebase.auth().currentUser.nickname}_${nickname}`).update({
        latestMessageTimestamp: + new Date()
    });
    firebase.database().ref(`latest/${nickname}/${firebase.auth().currentUser.nickname}_${nickname}`).update({
        latestMessageTimestamp: + new Date()
    });

}

function showSnackbar(messageStr) {
    messageSnackbarElement.className = "show";
    messageSnackbarElement.innerHTML = messageStr;
    setTimeout(() => {
        messageSnackbarElement.className = messageSnackbarElement.className.replace("show", "");
    }, 3000);
}

function initMainEventListeners(){
    firebase.database().ref(`latest/${firebase.auth().currentUser.nickname}`).on("child_changed", function(){
        initGroupsList().then(function(){
            initContactsList();
        })
    });
}



//TESTING AN' SHIT

function test() {
    firebase.database().ref("groups").on("value", function (snap) {
        snap.forEach(function(snap2){
            console.log(snap2.val());
        });
    });
}


