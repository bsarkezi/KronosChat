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
        var data = {
            message: 'You can only share images',
            timeout: 2000
        };
        signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
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
function authStateObserver(user) {
    if (user) { // User is signed in!

        // console.log(firebase.auth().currentUser.uid);

        initGroupsList().then(function(){
            initContactsList();
        })

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

    } else { // User is signed out!

        contactsListElement.innerHTML="";
        
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
    var data = {
        message: 'You must sign-in first',
        timeout: 2000
    };
    signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
    return false;
}

// Resets the given MaterialTextField.
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
    '</div>';

// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';

// Displays a Message in the UI.
function displayMessage(key, name, text, picUrl, imageUrl) {
    // var div = document.getElementById(key);
    var div = document.getElementById(key);
    // If an element for that message does not exist yet we create it.
    if (!div) {
        var container = document.createElement('div');
        container.innerHTML = MESSAGE_TEMPLATE;
        div = container.firstChild;
        div.setAttribute('id', key);
        messageListElement.appendChild(div);
    }
    if (picUrl) {
        div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
    }
    div.querySelector('.name').textContent = name;
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
var submitButtonElement = document.getElementById('submit');
var imageButtonElement = document.getElementById('submitImage');
var imageFormElement = document.getElementById('image-form');
var mediaCaptureElement = document.getElementById('mediaCapture');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');

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

var groups = [];

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
        snap.forEach((a) => {
            a.val().participants.forEach((p) => {
                if (p == firebase.auth().currentUser.email) {
                    groups.push(a.val());
                }
            });
        });
    });
}


function initContactsList() {

    var a = [];
    //contactsListElement.innerHTML="";


    firebase.database().ref("latest/"+firebase.auth().currentUser.uid).orderByChild("latestMessageTimestamp").once("value",function(snap){
        snap.forEach(function(childSnap){
            a.push(childSnap.val());
        });      
        groups.forEach(function(group){
            var temp = group;
            temp.convoPartner = group.displayName;
            //delete temp.displayName;
            a.push(temp);

        })
    }).then(function(){
        for(var i = 0; i < a.length - 1 ;i++){
            for(var j = 1; j <= i; j++ ){
                if(a[j-1].latestMessageTimestamp<a[i].latestMessageTimestamp){
                    var temp = a[j-1];
                    a[j-1] = a[j];
                    a[j]= temp;
                }
            }
        }

        contactsListElement.innerHTML="";
        for (var i = 0; i < a.length; i++) {
            var contactsToAdd = "<p><b>" + a[i].convoPartner + "</b></p><p>"+a[i].latestMessage+"</p>";
            var aa = document.createElement("div");
            aa.className = "contact"
            aa.innerHTML = contactsToAdd;
            document.getElementById("contacts").appendChild(aa);
        }

        $(".contact").click(function () {
            $("#contact-name").removeAttr("hidden");
            $("#contact-name").text($(this).find("p:first").text());
            loadMessages();
        });
    });

    // contactsListElement.innerHTML="";

    // firebase.database().ref("users/").once("value").then(function (snapshot) {
    //     var usersArray = snapshotToArray(snapshot);

    //     //B.Š. - removal of currently logged in user from contacts list
    //     for (var i = 0; i < usersArray.length; i++) {
    //         if (usersArray[i].email == firebase.auth().currentUser.email) {
    //             usersArray.splice(i, 1);
    //         }
    //     }

    //     groups.forEach(function (g) {
    //         usersArray.push(g);
    //     })

    //     for (var i = 0; i < usersArray.length; i++) {
    //         var contactsToAdd = "<p><b>" + usersArray[i].displayName + "</b></p><p>Lorem ipsum dolor sit amet</p>";
    //         var aa = document.createElement("div");
    //         aa.className = "contact"
    //         aa.innerHTML = contactsToAdd;
    //         document.getElementById("contacts").appendChild(aa);
    //     }
    //     $(".contact").click(function () {
    //         $("#contact-name").removeAttr("hidden");
    //         $("#contact-name").text($(this).find("p:first").text());
    //         loadMessages();
    //     });

    // })
}

// Loads chat messages history and listens for upcoming ones.
function loadMessages() {

    messageListElement.innerHTML = '<span id="message-filler"></span>';

    var msgCallback = function (snap) {
        var data = snap.val();
        console.log(data);
        initContactsList();
        displayMessage(snap.key, data.sender, data.content, data.profilePic, data.imageUrl);
    };

    firebase.database().ref("users").orderByChild("email").equalTo($("#contact-name").text()).on("value", function (snapshot) {
        if (snapshot.exists()) {

            firebase.database().ref("users").orderByChild("email").equalTo($("#contact-name").text()).on("child_added", function (snapshot) {
                var secondUserUid = snapshot.val().uid;
                firebase.database().ref("chats").once("value").then(function (snapshot) {
                    if (snapshot.hasChild(firebase.auth().currentUser.uid + "_" + secondUserUid)) {
                        firebase.database().ref("/chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid + "/messages").on("child_added", msgCallback);
                        firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid + "/messages").on("child_changed", msgCallback);
                    }
                    else if (snapshot.hasChild(secondUserUid + "_" + firebase.auth().currentUser.uid)) {
                        firebase.database().ref("chats/" + secondUserUid + "_" + firebase.auth().currentUser.uid + "/messages").on("child_added", msgCallback);
                        firebase.database().ref("chats/" + secondUserUid + "_" + firebase.auth().currentUser.uid + "/messages").on("child_changed", msgCallback);
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

    if ($("#contact-name").text() == "") {
        var data = {
            message: "Please select a contact first",
            timeout: 2000
        }
        signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
        return;
    }

    else {
        firebase.database().ref("users").orderByChild("email").equalTo($("#contact-name").text()).on("value", function (snapshot) {
            
            //INDIVIDUAL CHATS
            if (snapshot.exists()) {
                firebase.database().ref("users").orderByChild("email").equalTo($("#contact-name").text()).once("child_added", function (snapshot) {
                    var secondUserUid = snapshot.val().uid;
                    firebase.database().ref("chats").once("value").then(function (snapshot) {
                        //  B.Š. - check if conversations already exist, if not, create a new convo. 
                        //  Checks for uid1_uid2, uid2_uid1 convo names.

                        if (snapshot.hasChild(firebase.auth().currentUser.uid + "_" + secondUserUid)) {
                            firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid).update({
                                participants: [firebase.auth().currentUser.email, $("#contact-name").text()],
                                latestMessage: + new Date(),
                                message: msgText,
                                sender: firebase.auth().currentUser.email,
                                groupChat: false
                            }).then(function () {
                                resetMaterialTextfield(messageInputElement);
                                toggleButton();
                                firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid + "/messages").push({
                                    type: "text",
                                    content: msgText,
                                    sender: firebase.auth().currentUser.email,
                                    timestamp: + new Date(),
                                    profilePic: firebase.auth().currentUser.photoURL
                                });
                            });
                            firebase.database().ref("latest/" + firebase.auth().currentUser.uid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                latestMessage:msgText,
                                latestMessageSender: firebase.auth().currentUser.email,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: $("#contact-name").text(),
                                type:"text"
                            });
                            firebase.database().ref("latest/" + secondUserUid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                latestMessage:msgText,
                                latestMessageSender: firebase.auth().currentUser.email,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: firebase.auth().currentUser.email,
                                type:"text"
                            });

                        }
                        else if (snapshot.hasChild(secondUserUid + "_" + firebase.auth().currentUser.uid)) {
                            firebase.database().ref("chats/" + secondUserUid + "_" + firebase.auth().currentUser.uid).update({
                                participants: [firebase.auth().currentUser.email, $("#contact-name").text()],
                                latestMessage: + new Date(),
                                message: msgText,
                                sender: firebase.auth().currentUser.email,
                                groupChat: false,
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function () {
                                resetMaterialTextfield(messageInputElement);
                                toggleButton();
                                firebase.database().ref("chats/" + secondUserUid + "_" + firebase.auth().currentUser.uid + "/messages").push({
                                    type: "text",
                                    content: msgText,
                                    sender: firebase.auth().currentUser.email,
                                    timestamp: + new Date()
                                });
                            });
                            firebase.database().ref("latest/" + firebase.auth().currentUser.uid +"/"+ secondUserUid + "_" + firebase.auth().currentUser.uid).set({
                                latestMessage:msgText,
                                latestMessageSender: firebase.auth().currentUser.email,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: $("#contact-name").text(),
                                type:"text"
                            });
                            firebase.database().ref("latest/" + secondUserUid +"/"+ secondUserUid + "_" + firebase.auth().currentUser.uid).set({
                                latestMessage:msgText,
                                latestMessageSender: firebase.auth().currentUser.email,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: firebase.auth().currentUser.email,
                                type:"text"
                            });
                        }
                        else {
                            firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                participants: [firebase.auth().currentUser.email, $("#contact-name").text()],
                                latestMessage: + new Date(),
                                message: msgText,
                                latestMessageSender: firebase.auth().currentUser.email,
                                groupChat: false,
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function () {
                                resetMaterialTextfield(messageInputElement);
                                toggleButton();

                                firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid + "/messages").push({
                                    type: "text",
                                    content: msgText,
                                    sender: firebase.auth().currentUser.email,
                                    timestamp: + new Date()
                                });
                            });
                            firebase.database().ref("latest/" + firebase.auth().currentUser.uid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                latestMessage:msgText,
                                latestMessageSender: firebase.auth().currentUser.email,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: $("#contact-name").text(),
                                type:"text"
                            });
                            firebase.database().ref("latest/" + secondUserUid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                latestMessage:msgText,
                                latestMessageSender: firebase.auth().currentUser.email,
                                latestMessageTimestamp: + new Date(),
                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                convoPartner: firebase.auth().currentUser.email,
                                type:"text"
                            });
                        }
                    });
                })
            }

            //GROUP CHATS
            else {
                firebase.database().ref("chats/" + $("#contact-name").text()).update({
                    latestMessage: + new Date(),
                    latestMessageSender: firebase.auth().currentUser.email,
                    latestMessage: msgText,
                    profilePic: firebase.auth().currentUser.email,
                }).then(function () {
                    resetMaterialTextfield(messageInputElement);
                    toggleButton();

                    firebase.database().ref("chats/" + $("#contact-name").text() + "/messages").push({
                        content: msgText,
                        sender: firebase.auth().currentUser.email,
                        type: "text",
                        profilePic: firebase.auth().currentUser.photoURL,

                    })
                });

                firebase.database().ref("groups/" + $("#contact-name").text()).update({
                    latestMessageTimestamp: + new Date(),
                    latestMessageSender: firebase.auth().currentUser.email,
                    latestMessage: msgText,
                    profilePic: firebase.auth().currentUser.email,
                });



                //TODO: napraviti Cloud Funkciju da svim clanovima grupe u latest stavi grupa/poruke
                // staviti kao trigger kada se updatea grupa s najnovijim porukama ili kada dode poruka u grupu

                firebase.database().ref("latest/" + $("#contact-name").text()).update({
                    latestMessage:msgText,
                    latestMessageSender: firebase.auth().currentUser.email,
                    latestMessageTimestamp: + new Date(),
                    latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                    type: "text"
                });
            }
        });
        return;
    }
}

function saveImageMessage(file) {
    
    firebase.database().ref("users").orderByChild("email").equalTo($("#contact-name").text()).on("value", function (snapshot) {
        if (snapshot.exists()) {
            firebase.database().ref("users").orderByChild("email").equalTo($("#contact-name").text()).once("child_added", function (snapshot) {
                var secondUserUid = snapshot.val().uid;
                firebase.database().ref("chats").once("value").then(function (snapshot) {
                    if (snapshot.hasChild(firebase.auth().currentUser.uid + "_" + secondUserUid)) {
                        firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid).update({
                            participants: [firebase.auth().currentUser.email, $("#contact-name").text()],
                            latestMessage: + new Date(),
                            message: "Image",
                            sender: firebase.auth().currentUser.email,
                            groupChat: false,
                            type: "image"
                        }).then(function () {

                            firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid + "/messages").push({
                                type: "text",
                                imageUrl: LOADING_IMAGE_URL,
                                sender: firebase.auth().currentUser.email,
                                timestamp: + new Date(),
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function (messageRef) {
                                var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
                                return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
                                    // Generate a public URL for the file.
                                    return fileSnapshot.ref.getDownloadURL().then((url) => {
                                        // Update the chat message placeholder with the image's URL.
                                        return messageRef.update({
                                            imageUrl: url,
                                            storageUri: fileSnapshot.metadata.fullPath
                                        }).then(function(){
                                            firebase.database().ref("latest/" + firebase.auth().currentUser.uid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                                latestMessage:"",
                                                latestMessageSender: firebase.auth().currentUser.email,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: $("#contact-name").text(),
                                                type: "image"
                                            });
                                            firebase.database().ref("latest/" + secondUserUid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                                latestMessage:"",
                                                latestMessageSender: firebase.auth().currentUser.email,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: firebase.auth().currentUser.email,
                                                type:"image"
                                            });
                                        });
                                    });
                                });
                            });
                        });

                    }
                    else if(snapshot.hasChild(secondUserUid + "_" + firebase.auth().currentUser.uid)){
                        firebase.database().ref("chats/" + secondUserUid + "_" + firebase.auth().currentUser.uid).update({
                            participants: [ $("#contact-name").text(), firebase.auth().currentUser.email],
                            latestMessage: + new Date(),
                            message: "Image",
                            sender: firebase.auth().currentUser.email,
                            groupChat: false,
                            type: "image"
                        }).then(function () {
                            firebase.database().ref("chats/" + secondUserUid + "_" + firebase.auth().currentUser.uid + "/messages").push({
                                type: "text",
                                imageUrl: LOADING_IMAGE_URL,
                                sender: firebase.auth().currentUser.email,
                                timestamp: + new Date(),
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function (messageRef) {
                                var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
                                return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
                                    // Generate a public URL for the file.
                                    return fileSnapshot.ref.getDownloadURL().then((url) => {
                                        // Update the chat message placeholder with the image's URL.
                                        return messageRef.update({
                                            imageUrl: url,
                                            storageUri: fileSnapshot.metadata.fullPath
                                        }).then(function(){
                                            firebase.database().ref("latest/" + firebase.auth().currentUser.uid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                                latestMessage:"",
                                                latestMessageSender: firebase.auth().currentUser.email,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: $("#contact-name").text(),
                                                type: "image"
                                            });
                                            firebase.database().ref("latest/" + secondUserUid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                                latestMessage:"",
                                                latestMessageSender: firebase.auth().currentUser.email,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: firebase.auth().currentUser.email,
                                                type:"image"
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }
                    else{
                        firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                            participants: [firebase.auth().currentUser.email, $("#contact-name").text()],
                            latestMessage: + new Date(),
                            message: "Image",
                            sender: firebase.auth().currentUser.email,
                            groupChat: false,
                            type: "image"
                        }).then(function () {

                            firebase.database().ref("chats/" + firebase.auth().currentUser.uid + "_" + secondUserUid + "/messages").push({
                                type: "text",
                                imageUrl: LOADING_IMAGE_URL,
                                sender: firebase.auth().currentUser.email,
                                timestamp: + new Date(),
                                profilePic: firebase.auth().currentUser.photoURL
                            }).then(function (messageRef) {
                                var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
                                return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
                                    // Generate a public URL for the file.
                                    return fileSnapshot.ref.getDownloadURL().then((url) => {
                                        // Update the chat message placeholder with the image's URL.
                                        return messageRef.update({
                                            imageUrl: url,
                                            storageUri: fileSnapshot.metadata.fullPath
                                        }).then(function(){
                                            firebase.database().ref("latest/" + firebase.auth().currentUser.uid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                                latestMessage:"",
                                                latestMessageSender: firebase.auth().currentUser.email,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: $("#contact-name").text(),
                                                type: "image"
                                            });
                                            firebase.database().ref("latest/" + secondUserUid +"/"+ firebase.auth().currentUser.uid + "_" + secondUserUid).set({
                                                latestMessage:"",
                                                latestMessageSender: firebase.auth().currentUser.email,
                                                latestMessageTimestamp: + new Date(),
                                                latestMessageSenderProfilePic: firebase.auth().currentUser.photoURL,
                                                convoPartner: firebase.auth().currentUser.email,
                                                type:"image"
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

        else{
            firebase.database().ref("chats/" + $("#contact-name").text()).update({
                participants: [firebase.auth().currentUser.email, $("#contact-name").text()],
                latestMessage: + new Date(),
                message: "Image",
                sender: firebase.auth().currentUser.email,
                groupChat: true,
                type: "image"
            }).then(function () {

                firebase.database().ref("chats/" + $("#contact-name").text() + "/messages").push({
                    type: "text",
                    imageUrl: LOADING_IMAGE_URL,
                    sender: firebase.auth().currentUser.email,
                    timestamp: + new Date(),
                    profilePic: firebase.auth().currentUser.photoURL
                }).then(function (messageRef) {
                    var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
                    return firebase.storage().ref(filePath).put(file).then(function (fileSnapshot) {
                        // Generate a public URL for the file.
                        return fileSnapshot.ref.getDownloadURL().then((url) => {
                            // Update the chat message placeholder with the image's URL.
                            return messageRef.update({
                                imageUrl: url,
                                storageUri: fileSnapshot.metadata.fullPath
                            }).then(function(){
                                firebase.database().ref("latest/" + $("#contact-name").text()).update({
                                    latestMessage:"",
                                    latestMessageSender: firebase.auth().currentUser.email,
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

//B.Š. - first load user's group chats asynchronously, and only when it's done load the rest of the contacts list
window.onload = function () {
    
    

};

// initGroupsList().then(function () {
//     initContactsList();
// });

// $(document).ready(function(){
//     initGroupsList().then(function(){
//         initContactsList()
//     });
// })

//TESTING AN' SHIT

function test() {
    var a = [];
    //contactsListElement.innerHTML="";


    firebase.database().ref("latest/"+firebase.auth().currentUser.uid).orderByChild("latestMessageTimestamp").once("value",function(snap){
        snap.forEach(function(childSnap){
            a.push(childSnap.val());
        });      
        groups.forEach(function(group){
            var temp = group;
            temp.convoPartner = group.displayName;
            //delete temp.displayName;
            a.push(temp);

        })
    }).then(function(){
        for(var i = 0; i < a.length - 1 ;i++){
            for(var j = 1; j <= i; j++ ){
                if(a[j-1].latestMessageTimestamp<a[i].latestMessageTimestamp){
                    var temp = a[j-1];
                    a[j-1] = a[j];
                    a[j]= temp;
                }
            }
        }

        console.log(a);
        contactsListElement.innerHTML="";
        for (var i = 0; i < a.length; i++) {
            var contactsToAdd = "<p><b>" + a[i].convoPartner + "</b></p><p>"+a[i].latestMessage+"</p>";
            var aa = document.createElement("div");
            aa.className = "contact"
            aa.innerHTML = contactsToAdd;
            document.getElementById("contacts").appendChild(aa);
        }

        $(".contact").click(function () {
            $("#contact-name").removeAttr("hidden");
            $("#contact-name").text($(this).find("p:first").text());
            loadMessages();
        });
    });

    return;
}



