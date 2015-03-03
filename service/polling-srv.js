'use strict';

app.factory('pollingSrv', ['$http', '$q', 'messageApi', pollingSrv]);

function pollingSrv($http, $q, messageApi) {

    var lastQuestionID;
    var timeout;
    var categoryId;
    var stopped = true;

    var defaults = {
        categoryId: INBOX,
        lastQuestionID: 0,
        timeout: 2000
    };
    var options = {};

    var onNewMessageCallback;
    var timer;

    var checkMessage = function () {
        if (!stopped) {
            console.log('checking in category ' + categoryId + ' last ID: ' + lastQuestionID + ' next check ' + timeout + ' ms');
            messageApi.getQuestionsByCategoryId(categoryId, lastQuestionID).then(function (questions) {
                if (questions !== null && questions.length > 0) {
                    var sorted = _.sortBy(questions, 'ID');
                    lastQuestionID = sorted[sorted.length - 1].ID;
                    onNewMessageCallback(lastQuestionID, questions);
                }
                //if (!stopped) {
                    setTimeout(checkMessage, timeout);
                //}
            });
        }

    }

    function start(callback, options) {
        lastQuestionID = options.lastQuestionID || defaults.lastQuestionID;
        timeout = options.timeout || defaults.timeout;
        categoryId = options.categoryId || defaults.categoryId;
        onNewMessageCallback = callback;
        stopped = false;
        timer = setTimeout(checkMessage, options.timeout);
    }

    function stop() {
        stopped = true;
        clearTimeout(timer);
    }

    return {
        start: start,
        stop: stop
    }
}
