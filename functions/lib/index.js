"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
exports.addUser = functions.auth.user().onCreate((user) => {
    admin.database().ref("users/" + user.uid).set({
        email: user.email,
        name: user.displayName,
        profilePic: user.photoURL,
        uid: user.uid,
        nickname: ""
    });
    console.log("User added");
});
//# sourceMappingURL=index.js.map