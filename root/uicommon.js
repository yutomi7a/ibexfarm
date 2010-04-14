function caseInsensitiveSortingFunction (x,y) { 
  var a = String(x).toUpperCase(); 
  var b = String(y).toUpperCase(); 
  if (a > b) 
     return 1 
  if (a < b) 
     return -1 
  return 0; 
}

// Add "before_show", "after_show", "before_hide", "after_hide",
// "before_toggle", "after_toggle", "before_toggle_or_show" and "after_toggle_or_show"
// events to jQuery. What a mess!
(function () {
function add2(f) { // Note that this is specifically designed for 'show', 'hide' and 'toggle'.
    var original = $.prototype[f];
    $.prototype[f] = function (a, b) {
        // If we use 'trigger' instead of 'triggerHandler', we get nasty infinite
        // loops when things within things are hidden, which (I think) are due to
        // event bubbling.

        var cache = $(this);

        // We raise an event only if there is no registered handler for "before_toggle_or_show";
        var cde = cache.data('events');
        if ((f != "show" && f != "toggle") || ! (cde && cde.before_toggle_or_show))
            cache.triggerHandler("before_" + f);
        else cache.triggerHandler("before_toggle_or_show");
        var t = this;
        if (a) {
            return original.call(this, a, function () {
                var r;
                if (b)
                    r = b();
                if ((f != "show" && f != "toggle") || ! (cde && cde.after_toggle_or_show))
                    $(t).triggerHandler("after_" + f);
                else cache.triggerHandler("after_toggle_or_show");
                return r;
            });
        }
        else {
            var r = original.call(this, a);
            if ((f != "show" && f != "toggle") || ! (cde && cde.after_toggle_or_show))
                $(t).triggerHandler("after_" + f);
            else cache.triggerHandler("after_toggle_or_show");
            return r;
        }
    };
};
add2("show");
add2("hide");
add2("toggle");
})();

// Code for doing ajax spinner thingy.
// This waits 500ms before adding a spinner (distracting to have them
// flash for <500ms).
function spinnifyAjax(spincontainer, ajaxArgs) {
    var origError = ajaxArgs.error;
    var origSuccess = ajaxArgs.success;

    var spinner = $("<div>")
                  .css('width', 16).css('height', 16)
                  .css('background-image', "url('" + BASE_URI + 'static/images/ajax-loader.gif' + "')");
    var timeoutId = setTimeout(function () { spincontainer.append(spinner); }, 500);
    ajaxArgs.error = function () {
        clearTimeout(timeoutId);
        spinner.remove();
        if (origError) return origError();
    };
    ajaxArgs.success = function (data) {
        clearTimeout(timeoutId);
        spinner.remove();
        if(origSuccess) { return origSuccess(data); }
    };
    return $.ajax(ajaxArgs);
}
function spinnifyPOST(spincontainer, url, args, callback, type) {
    return spinnifyAjax(spincontainer, {
        url: url,
        data: args,
        type: "POST",
        success: callback,
        dataType: type
    });
}
function spinnifyGET(spincontainer, url, callback, type) {
    return spinnifyAjax(spincontainer, {
        url: url,
        type: "GET",
        success: callback,
        dataType: type || "json"
    });
}

(function (isChrome) {
$.widget("ui.flash", {
    _init: function () {
        this.element.attr('id', 'highlighted');
        var t = this;
        var color = '#BD2031';
        if (this.options.type == 'message') { color = 'yellow'; }
        // WEIRD!
        // 'highlight' effect appears not to work in Chrome (beta, OS X) (jQuery bug?)
        if (! isChrome) {
            this.element.effect("highlight", {color: color}, 2500, function () {
                t.element.attr('id', null);
            });
        }
        else {
            var old = this.element.css('background-color');
            this.element.css('background-color', color);
            setTimeout(function () { t.element.attr('id', null); t.element.css('background-color', old); }, 2500);
        }
    }
});
})(navigator.userAgent && navigator.userAgent.search(/Chrome/) != -1);

$.widget("ui.areYouSure", {
    _init: function () {
        this.element.addClass("areYouSure");

        var cancel;
        var chk;
        var del;
        this.element
            .append($("<div>").addClass("box")
                .append(this.options.question)
                .append($("<p>")
                        .append(cancel = $("<span>").addClass("linklike").addClass("cancel").text(" cancel"))
                        .append(" / ")
                        .append(chk = $("<input type='checkbox'>"))
                        .append(del = $("<input type='button'>").attr('value', this.options.actionText))));

        var t = this;

        cancel.click(function () {
            t.options.cancelCallback();
        });

        del.click(function () {
            if (! chk.attr('checked')) {
                alert(t.options.uncheckedMessage);
                return;
            }

            t.options.actionCallback();
        });
    }
});

$.widget("ui.rename", {
    _init: function () {
        var rename_inp;
        var rename_cancel;
        var rename_btn;
        var rename_error;
        this.element
            .addClass("rename")
            .append($("<div>").addClass("box")
                    .append(rename_inp = $("<input>")
                            .attr('size', 20)
                            .attr('type', 'text')
                            .attr('value', this.options.name))
                    .append(rename_cancel = $("<span>").addClass("linklike").text("cancel"))
                    .append(" / ")
                    .append(rename_btn = $("<input type='button'>").attr("value", "rename"))
                    .append(rename_error = $("<div>")
                            .hide()
                            .addClass("error")))
            .hide();

        var t = this;
        rename_btn.click(function () { t.options.actionCallback(rename_inp.attr('value')); });
        rename_inp.keypress(function (e) {
            if (e.which == 13) // Return
                t.options.actionCallback(rename_inp.attr('value'));
        });

        rename_cancel.click(this.options.cancelCallback);

        this.rename_error = rename_error;

        // Highlight the input field text when it's shown.
        rename_inp.get(0).select();
        $(this.element).bind("after_toggle_or_show", null, function () { rename_inp.get(0).select(); });
        // Hide the error message when the whole thing is hidden.
        $(this.element).bind("before_hide", null, function () { rename_error.hide(); });
    },

    showError: function (error) {
        this.rename_error.html(error);
        this.rename_error.show();
    },
    hideError: function (error) {
        this.rename_error.hide("normal");
    }
});
