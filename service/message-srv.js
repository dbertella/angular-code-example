'use strict';

//var meetingId = 1;
var baseHttpUrl = '/admin/api/meeting/' + meetingId;
var INBOX = 1;
var TRASH = 2;
var anonymousUser = 'anonymous';

app.factory('messageApi', ['$http', '$q', messageApi]);

function messageApi($http, $q) {


    /* Helpers */
    function get(resource) {
        resource = resource || '';
        var deferred = $q.defer();
        var url = baseHttpUrl + resource;
        $http.get(url)
            .success(function (data) {
                deferred.resolve(data);
            })
            .error(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;

    };

    function post(resource, data) {

        var deferred = $q.defer();
        var url = baseHttpUrl + resource;
        $http.post(url, data)
            .success(function (data) {
                deferred.resolve(data);
            })
            .error(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;

    };

    /* Meeting */

    function getMeeting() {
        return get();
    }

    /* Questions */

    function getQuestions() {
        return get('/questions/all');
    }

    function getQuestionsByCategoryId(categoryId, lastID) {
        lastID = lastID || 0;
        return get('/questions/filter-by-category/' + categoryId + '?lastID=' + lastID);
    }

    function getLastQuestionId(categoryId) {
        return get('/questions/last-id/' + categoryId);
    }

    function getQuestionsById(questionId) {
        return get('/questions/filter-by-id/' + questionId);
    }

    function addQuestion(text, channel, categoryId, user) {
        channel = channel || 'WEB';
        categoryId = categoryId || INBOX; //INBOX=1,
        user = user || anonymousUser;
        return post('/questions/add/', { Question: text, UserIdentifier: user, Channel: channel, MeetingID: meetingId, CategoryID: categoryId });
    }

    function updateQuestionText(questionId, text) {
        return post('/questions/change-text/' + questionId, { Question: text });
    }

    function moveQuestionToCategory(questionId, categoryId) {
        return post('/questions/move/' + questionId, { CategoryID: categoryId });
    }

    function deleteQuestion(questionId) {
        return post('/questions/move-to-trash/' + questionId);
    }

    function markQuestionAsRead(questionId) {
        return post('/questions/mark-as-read/' + questionId);
    }

    function markQuestionAsUnread(questionId) {
        return post('/questions/mark-as-unread/' + questionId);
    }

    function insertQuestionToViewer(questionId, viewerId) {
        return post('/questions/add-to-viewer/' + questionId, { ID: viewerId });
    }

    function removeQuestionFromViewer(questionId, viewerId) {
        return post('/questions/remove-from-viewer/' + questionId, { ID: viewerId });
    }

    function sortQuestionsInViewer(viewerId, questionsId)
    {               
        var questions = [];
        _.each(questionsId, function (id) {
            questions.push({ QuestionID: id });
        });
        var viewer = { ID: viewerId, Questions: questions };        
        return post('/questions/sort-viewer/', viewer);

    }

    function emptyTrash() {
        return post('/questions/empty-trash/');
    }
  
    /* Categories */

    function getCategories() {
        return get('/categories/all');
    }

    function addCategory(name) {
        return post('/categories/add', { Name: name });
    }

    function updateCategory(categoryId, name) {
        return post('/categories/update/' + categoryId, { Name: name });
    }

    function deleteCategory(categoryId) {
        return post('/categories/delete/' + categoryId);
    }

    /* Viewer */

    function getViewers() {
       return get('/viewers/all');       
    }

    function getQuestionsByViewerId(viewerId) {
        return get('/questions/filter-by-viewer/' + viewerId);
    }

    return {
        getMeeting: getMeeting,
        getQuestions: getQuestions,
        getLastQuestionId: getLastQuestionId,
        getQuestionsById: getQuestionsById,
        getQuestionsByCategoryId: getQuestionsByCategoryId,
        getQuestionsByViewerId: getQuestionsByViewerId,
        addQuestion: addQuestion,
        updateQuestionText: updateQuestionText,
        moveQuestionToCategory: moveQuestionToCategory,
        deleteQuestion: deleteQuestion,
        markQuestionAsRead: markQuestionAsRead,
        markQuestionAsUnread: markQuestionAsUnread,
        insertQuestionToViewer: insertQuestionToViewer,
        removeQuestionFromViewer: removeQuestionFromViewer,
        sortQuestionsInViewer: sortQuestionsInViewer,
        emptyTrash: emptyTrash,
        getCategories: getCategories,
        addCategory: addCategory,
        updateCategory: updateCategory,
        deleteCategory: deleteCategory,
        getViewers: getViewers
    };
}
