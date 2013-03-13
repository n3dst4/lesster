/*globals less:false, ace:false, $:false, Notifier:false */
"use strict";
$(function(){

var loginForm = $("#login-form");
var twitterForm = $("#twitter-login-form");
var loginUrl = "/login";

loginForm.on("submit", function() {
    $.post( loginUrl, loginForm.serialize()).done(function(data, textStatus, jqXHR){
        Notifier.success(null, "You are now logged in");
        refreshUserDetails();
    }).fail(function (jqXHR, textStatus, errorThrown) {
        Notifier.error(
            (jqXHR.status === 401)? 
                "Username or password incorrect" : 
                "Could not contact login server", 
            "Login failed");
    });
    return false;
});

twitterForm.on("submit", function () {
    var windowObjectReference = window.open(
        "/twitter-login", 
        "twitter-login",
        "width=320,height=480,menubar=no,toolbar=no,dependent=yes,dialog=yes"
    );
    return false;
});

refreshUserDetails();

function refreshUserDetails() {
    $.get("/userdetails", function (data, textStatus, jqXHR) {
        $(".logged-out").hide();
        $(".logged-in").show();
    });
}

window.lesster = window.lesster || {};
window.lesster.refreshUserDetails = refreshUserDetails;

// end of module
});