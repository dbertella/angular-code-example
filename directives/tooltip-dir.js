'use strict';

app.directive('qmTooltip', function () {

    return {
        restrict: 'A',        
        scope: true,
        template: function (element, attrs) {
            return '<span class="tooltip" ng-bind="' + attrs.qmTooltip + '"></span>';
        },
        link: function (scope, element, attrs) {
            //console.log(attrs.qmTooltip);
            element
                .on('mouseenter', function () {
                    element.addClass('show');
                })
                .on('mouseleave', function () {
                    element.removeClass('show');
                })
                .on('click', function () {
                    element.toggleClass('show');
                });
        }
    };
});