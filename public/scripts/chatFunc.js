$(".contact").click(function(){
    $("#contact-name").text($(this).find("p:first").text());
});

function snapshotToArray(snapshot) {
    var returnArr = [];

    snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;

        returnArr.push(item);
    });

    return returnArr;
};

function initUserList(){
    firebase.database().ref("users/").once("value").then(function(snapshot){
        var usersArray = snapshotToArray(snapshot);        
        var userDetail;
        for(var i = 0; i<usersArray.length;i++){
            userDetail= usersArray[i].email;
            var contactsToAdd = "<p><b>"+userDetail.substring(0, userDetail.indexOf("@"))+"</b></p><p>Lorem ipsum dolor sit amet</p>";
            var aa = document.createElement("div");
            aa.className="contact"
            aa.innerHTML=contactsToAdd;
            document.getElementById("contacts").appendChild(aa);
        }
        $(".contact").click(function(){
            $("#contact-name").text($(this).find("p:first").text());
        });
    })
}

window.onload=function(){
    initUserList();
};

