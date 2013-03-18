/*globals less:false, ace:false, $:false, Notifier:false */
"use strict";
(function(){

var currentUser;

////////////////////////////////////////////////////////////////////////////////
// jQuery miniplugins

/*
 * Hijack a form so that it ajaxes its payload. 
 */
$.fn.hijackForm = function (done, fail, always) {
    var self = this,
        method = this.attr("method"),
        action = this.attr("action");
    this.on("submit", function() {
        $.ajax(action, {
            method: method,
            data: self.serialize()
        }).done(done).fail(fail).always(always);
        return false;
    });    
};


/*
 * Hijack a simple "log in with" form so it pops up in a new window. Assumed
 * that the plumbing is there to make said window do something clever when
 * oauth returns
 */
$.fn.hijackOAuthForm = function () {
    var self = this;
    self.on("submit", function (ev) {
        window.open(
            $(this).attr("action"), 
            "oauth-window",
            "width=1024,height=480,menubar=no,toolbar=no,dependent=yes,dialog=yes"
        );
        return false;
    });    
};


////////////////////////////////////////////////////////////////////////////////
// onload stuff
$(function(){
    // hijack the password login form
    $("#password-login-form").hijackForm(
        function(data, textStatus, jqXHR){
            displayUser(data);
        },
        function (jqXHR, textStatus, errorThrown) {
            Notifier.error(
                (jqXHR.status === 401)? 
                    "Username or password incorrect" : 
                    "Could not contact login server", 
                "Login failed");
        },
        null
        
    );
    
    // hijack the logout form
    $("#logout-form").hijackForm(null, null, refreshUserDetails);
    
    // hijack any and all oath forms (we don't need to name them all here, they all
    // work the same)
    $("form.oauth").hijackOAuthForm();
});

// do this once onload
refreshUserDetails();

////////////////////////////////////////////////////////////////////////////////
// login plumbing

function refreshUserDetails() {
    $.get("/userdetails").done(function (data, textStatus, jqXHR) {
        displayUser(data);
    }).fail(function () {
        // this should distinguish between 401 and 500/no connection
        displayUser(null);
    });
}



function displayUser(user) {
    $(function(){
        if (user) {
            $(".logged-out").hide();
            $(".logged-in").show();      
            if (currentUser !== user._id && currentUser !== undefined) {
                Notifier.success(null, "You are now logged in");
            }
            $("#username").html(renderUser(user));
            currentUser = user._id;
        }
        else {
            $(".logged-out").show();
            $(".logged-in").hide();
            if (currentUser !== undefined) Notifier.warning(null, "You are now logged out");
            currentUser = null;
        }
    });
}


function renderUser(user) {
    var username = user.username || user.twitterUsername || user.gitHubUsername;
    
    var username = (user.username ? renderFullUser :
        user.twitterId ? renderTwitterUser :
        user.gitHubId ? renderGitHubUser :
        $.noop)(user)

    return "<a href='/account'>" + username + "</a>";
}

function renderTwitterUser (user) {
    return "@" + user.twitterUsername + " (Twitter)";
}

function renderGitHubUser (user) {
    return user.gitHubUsername + " (GitHub)";
}


function renderFullUser (user) {
    return user.username;
}


// make refreshUserDetails globally available
window.lesster = window.lesster || {};
window.lesster.refreshUserDetails = refreshUserDetails;

// end of module
}());

























