import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const addUser = functions.auth.user().onCreate((user) =>{
    admin.database().ref("users/"+user.uid).set({
        email:user.email,
        name:user.displayName,
        profilePic: user.photoURL,
        uid: user.uid,
        nickname: ""
        })
})