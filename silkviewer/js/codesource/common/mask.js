//遮罩
; (function ($) {
    $.fn.mask = function (label, delay, loading, bgcolor) {
        $(this).each(function () {
            if (loading == null) {
                loading = true;
            }
            var bgcolorValue = "#cccccc";
            if (bgcolor) {
                bgcolorValue = bgcolor;
            }
            if (delay !== undefined && delay > 0 && delay != null) {
                var element = $(this);
                element.data("_mask_timeout", setTimeout(function () { $.maskElement(element, label, loading, bgcolorValue) }, delay));
            } else {
                $.maskElement($(this), label, loading, bgcolorValue);
            }
        });
    };

    $.fn.unmask = function () {
        $(this).each(function () {
            $.unmaskElement($(this));
        });
    };

    $.fn.isMasked = function () {
        return this.hasClass("masked");
    };

    $.maskElement = function (element, label, loading, bgcolor) {

        if (element.data("_mask_timeout") !== undefined) {
            clearTimeout(element.data("_mask_timeout"));
            element.removeData("_mask_timeout");
        }

        if (element.isMasked()) {
            $.unmaskElement(element);
        }

        if (element.css("position") == "static") {
            element.addClass("masked-relative");
        }

        element.addClass("masked");

        var maskDiv = $('<div class="loadmask"></div>');


        maskDiv.css({
            "backgroundColor": bgcolor
        })

        if (navigator.userAgent.toLowerCase().indexOf("msie") > -1) {
            maskDiv.height(element.height() + parseInt(element.css("padding-top")) + parseInt(element.css("padding-bottom")));
            maskDiv.width(element.width() + parseInt(element.css("padding-left")) + parseInt(element.css("padding-right")));
        }

        if (navigator.userAgent.toLowerCase().indexOf("msie 6") > -1) {
            element.find("select").addClass("masked-hidden");
        }

        element.append(maskDiv);
        maskDiv.show();
        if (label !== undefined && label != null) {
            var maskMsgDiv = $('<div class="loadmask-msg" style="display:none;"></div>');
            if (loading) {
                maskMsgDiv.append('<div class="mask_lading">' + label + '</div>');
            }
            else {
                maskMsgDiv.append('<div  class="normal">' + label + '</div>');
            }
            element.append(maskMsgDiv);

            maskMsgDiv.css("top", Math.round(element.height() / 2 - (maskMsgDiv.height() - parseInt(maskMsgDiv.css("padding-top")) - parseInt(maskMsgDiv.css("padding-bottom"))) / 2) + "px");
            maskMsgDiv.css("left", Math.round(element.width() / 2 - (maskMsgDiv.width() - parseInt(maskMsgDiv.css("padding-left")) - parseInt(maskMsgDiv.css("padding-right"))) / 2) + "px");

            maskMsgDiv.show();
        }

    };

    $.unmaskElement = function (element) {
        if (element.data("_mask_timeout") !== undefined) {
            clearTimeout(element.data("_mask_timeout"));
            element.removeData("_mask_timeout");
        }

        element.find(".loadmask-msg,.loadmask").remove();
        element.removeClass("masked");
        element.removeClass("masked-relative");
        element.find("select").removeClass("masked-hidden");
    };

})(jQuery);