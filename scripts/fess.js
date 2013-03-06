/*globals less:false, ace:false, $:false */
"use strict";
$(function(){
    var console = window.console || {log: $.noop};
    
    // countdown before we auto-update the eesult view
    var changeTimeout = 500;
    
    //var editTheme = "ace/theme/merbivore_soft";
    var editTheme = "ace/theme/tomorrow";
    var roTheme = "ace/theme/tomorrow";

    // window object from the iframe
    var frameWindow = $("#result-panel iframe")[0].contentWindow;
    
    var parser = new less.Parser();
    
    // set up all the ACE editors
    var styleEditor = ace.edit("style-editor");
    styleEditor.setTheme(editTheme);
    styleEditor.getSession().setMode("ace/mode/less");
    
    var cssOutput = ace.edit("css-output");
    cssOutput.setTheme(roTheme);
    cssOutput.getSession().setMode("ace/mode/css");
    cssOutput.setReadOnly(true);

    var htmlEditor = ace.edit("html-editor");
    htmlEditor.setTheme(editTheme);
    htmlEditor.getSession().setMode("ace/mode/html");

    styleEditor.setValue($("#initial-less").text());
    styleEditor.getSession().getSelection().clearSelection();
    htmlEditor.setValue($("#initial-html").text());


    // change events
    styleEditor.on("change", notifyUpdate);
    htmlEditor.on("change", notifyUpdate);
    
    notifyUpdate();
    
    // 
    var countdown = null;
    function notifyUpdate () {
        if (countdown) clearTimeout(countdown);
        countdown = setTimeout(update, changeTimeout);
    }
    
    function update () {
        countdown = null;
        
        parser.parse(styleEditor.getValue(), function (err, rules) {
            var sesh = styleEditor.getSession();
            var annotations
            if (err) {
                console.log("parsing error");
                console.log(err);
                annotations = [{
                    row: err.line - 1,
                    column: err.column - 1,
                    text: err.message,
                    type: "error" // also warning and information                            
                }];
            } else {
                console.log("parsed okay");
                annotations = [];
                var css = rules.toCSS();
                var scrollTop = cssOutput.getSession().getScrollTop();
                cssOutput.setValue(css);
                cssOutput.getSession().getSelection().clearSelection();
                cssOutput.getSession().setScrollTop(scrollTop);
                try {
                    frameWindow.setBody(htmlEditor.getValue());
                    frameWindow.setStyle(css);
                }
                catch (err) {
                    notifyUpdate();
                }
            }
            sesh.setAnnotations(annotations);
        });
        
    }
    
    
    
});