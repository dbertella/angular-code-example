'use strict';

app.directive('qmCount', function () {

    return {
        restrict: 'A',
        scope: {
            val: '='
        },
        link: function (scope, element, attrs) {
            scope.$watch('val', function (newValue, oldValue) {
                if (newValue > oldValue) {
                    element.addClass('plus');
                } else if (newValue < oldValue) {
                    element.addClass('minus');
                }                
                setTimeout(function () {
                    element.removeClass('plus minus');
                }, 400);
            }, true);
        }
    };
});