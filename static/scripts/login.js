/*globals less:false, ace:false, $:false, Notifier:false */
"use strict";
$(function(){

var loginForm = $("#login-form");
var loginUrl = "/login";

loginForm.on("submit", function() {
    
    $.post( loginUrl, loginForm.serialize()).done(function(data, textStatus, jqXHR){
        Notifier.success(null, "You are now logged in");
        getUserDetails();
    }).fail(function (jqXHR, textStatus, errorThrown) {
        Notifier.error(
            (jqXHR.status === 401)? 
                "Username or password incorrect" : 
                "Could not contact login server", 
            "Login failed");
    });
    
    return false;
});

getUserDetails();

function getUserDetails() {
    $.get("/userdetails", function (data, textStatus, jqXHR) {
        $(".logged-out").hide();
        $(".logged-in").show();
    });
}



// end of module
});