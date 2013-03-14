/*globals less:false, ace:false, $:false, Notifier:false */
"use strict";
$(function(){

var passwordForm = $("#password-login-form");
var twitterForm = $("#twitter-login-form");
var logoutForm = $("#logout-form");
var loginUrl = "/login";
var currentUser = null;


// hijack the password form
passwordForm.on("submit", function() {
    $.post( passwordForm.attr("action"), passwordForm.serialize()).done(function(data, textStatus, jqXHR){
        
        displayUser(data);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        Notifier.error(
            (jqXHR.status === 401)? 
                "Username or password incorrect" : 
                "Could not contact login server", 
            "Login failed");
    });
    return false;
});


// hijack the twitter form
twitterForm.on("submit", function () {
    var windowObjectReference = window.open(
        "/twitter-login", 
        "twitter-login",
        "width=320,height=480,menubar=no,toolbar=no,dependent=yes,dialog=yes"
    );
    return false;
});


// hijack the logout form
logoutForm.on("submit", function(event) {
    $.post( logoutForm.attr("action"), logoutForm.serialize()).always(function () {
        refreshUserDetails();
    });
    return false;
});



function refreshUserDetails() {
    $.get("/userdetails").done(function (data, textStatus, jqXHR) {
        displayUser(data);
    }).fail(function () {
        displayUser(null);
    });
}



function displayUser(user) {
    if (user) {
        $(".logged-out").hide();
        $(".logged-in").show();      
        if (currentUser !== user._id && currentUser !== undefined) {
            Notifier.success(null, "You are now logged in");
        }
        
        currentUser = user._id;
    }
    else {
        $(".logged-out").show();
        $(".logged-in").hide();
        if (currentUser !== undefined) Notifier.warning(null, "You are now logged out");
        currentUser = null;
    }
}


refreshUserDetails();


window.lesster = window.lesster || {};
window.lesster.refreshUserDetails = refreshUserDetails;

// end of module
});
























