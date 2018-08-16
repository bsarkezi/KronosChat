const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

//SOMETHING'S FUCKED YO
exports.addUser = functions.auth.user().onCreate(async function (user) {
    await admin.database().ref("users"+user.uid).set({
        email:user.email,
        name:user.displayName,
        profilePic: user.photoURL,
        uid: user.uid
    });
    console.log("User added");
});

// function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// exports.addUser = functions.auth.user().onCreate(function () {
//     var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(user) {
//         return regeneratorRuntime.wrap(function _callee$(_context) {
//             while (1) {
//                 switch (_context.prev = _context.next) {
//                     case 0:
//                         _context.next = 2;
//                         return admin.database().ref("users" + user.uid).set({
//                             email: user.email,
//                             name: user.displayName,
//                             profilePic: user.photoURL,
//                             uid: user.uid
//                         });

//                     case 2:
//                         console.log("User added");

//                     case 3:
//                     case "end":
//                         return _context.stop();
//                 }
//             }
//         }, _callee, undefined);
//     }));

//     return function (_x) {
//         return _ref.apply(this, arguments);
//     };
// }());