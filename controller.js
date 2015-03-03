'use strict';

app.controller('mainCtrl', ['$scope', '$sce', '$q', '$rootScope', 'messageApi', 'pollingSrv', mainCtrl]);

function mainCtrl($scope, $sce, $q, $rootScope, messageApi, pollingSrv) {

    angular.element(document).ready(function () {
        //console.log("document ready");
        var body = angular.element(document.querySelector('body'));
        setTimeout(function () {
            body.removeClass('loading');
            setTimeout(function () {
                angular.element(document.querySelector('.loading-wrapper')).addClass('hide');
            }, 400);
        }, 1000);
    });

    $scope.questions = [];
    $scope.categories = [];
    $scope.currentCategory = {};
    $scope.viewers = [];
    $scope.currentViewer = {};

    $q.all([
        messageApi.getMeeting(),
        messageApi.getCategories(),
        messageApi.getViewers(),
        messageApi.getQuestions()])
    .then(function (resultSet) {
        //meeting 
        var meeting = resultSet[0];
        //categories
        var categories = resultSet[1];
        //viewers
        var viewers = resultSet[2];
        //questions
        var questions = resultSet[3];

        _.each(categories, function (category) {
            category.list = _.filter(questions, function (element) {
                return element.CategoryID == category.ID;
            });
        });

        _.each(viewers, function (viewer) {
            viewer.Questions = _.sortBy(viewer.Questions, 'Priority');
            viewer.list = _.map(viewer.Questions, function (item) {
                return _.find(questions, { 'ID': item.QuestionID });
            });
        });

        _.each(questions, function (question) {
            initQuestion(question);

            var list = _.filter(viewers, function (viewer) {
                var questionsID = _.map(viewer.Questions, function (item) { return item.QuestionID; });
                return questionsID.indexOf(question.ID) != -1;
            });
            question.viewersID = _.map(list, function (item) { return item.ID; });
            //console.log(question);            
        });

        $scope.questions = questions;
        $scope.meeting = meeting;
        $scope.categories = categories;
        $scope.currentCategory = _.find(categories, { 'ID': INBOX });
        $scope.currentCategoryIndex = 1;
        $scope.activeCategory = 0;
        $scope.viewers = viewers;

        $scope.inbox = _.find(categories, { 'ID': INBOX });

        $scope.inboxLastID = 0;
        if ($scope.currentCategory.list.length > 0) {
            var sorted = _.sortBy($scope.currentCategory.list, 'ID');
            $scope.inboxLastID = sorted[sorted.length - 1].ID;
        }

        //--------------------------
        //Polling: Start Monitoring
        //--------------------------
        pollingSrv.start(function (lastQuestionID, questions) {
            if ($scope.inboxLastID < lastQuestionID) {
                console.log('new questions arrived: ' + questions.length);
                _.each(questions, function (question) {
                    initQuestion(question);
                    $scope.inbox.list.splice(0, 0, question);
                    $scope.questions.splice(0, 0, question);
                });

            }
            $scope.inboxLastID = lastQuestionID;
        }, { timeout: 5000, lastQuestionID: $scope.inboxLastID });

    });

    $scope.sidebarCollapsed = false;
    $scope.sidebarModified = false;
    $scope.moreOptions = false;
    $scope.showModal = false;
    $scope.showInfoModal = false;

    //helpers 
    function initQuestion(question) {
        question.toggled = false;
        question.viewersID = [];
    }

    //User interactions
    $scope.getViewerFromViewerId = function (viewerId) {
        var viewer = _.find($scope.viewers, { 'ID': viewerId });
        return viewer;
    };
    $scope.getCategoryFromCategoryId = function (categoryId) {
        var category = _.find($scope.categories, { 'ID': categoryId });
        return category;
    };


    $scope.collapse = function () {
        $scope.sidebarCollapsed = !$scope.sidebarCollapsed;
    }

    $scope.readAndMoreOptions = function (questionId) {
        var currentMessage = _.find($scope.currentCategory.list, { 'ID': questionId });

        _.each($scope.questions, function (question) {
            if (question.ID !== currentMessage.ID) {
                question.toggled = false;
            } else {
                currentMessage.toggled = !currentMessage.toggled;
            }
        });

        if (!currentMessage.Read) {
            messageApi.markQuestionAsRead(questionId).then(function () { currentMessage.Read = true; });
        }
    }

    $scope.updateQuestion = function (questionId) {
        var currentMessage = _.find($scope.currentCategory.list, { 'ID': questionId })
        messageApi.updateQuestionText(questionId, currentMessage.Question)
            .then(function () {
                currentMessage.toggled = false;
            });
    }

    $scope.undoQuestion = function (questionId) {
        var currentMessage = _.find($scope.currentCategory.list, { 'ID': questionId })
        messageApi.getQuestionsById(questionId).then(function (question) {
            currentMessage.Question = question.Question;
            currentMessage.toggled = false;
        });
    }

    $scope.unreadQuestion = function (questionId) {
        var currentMessage = _.find($scope.currentCategory.list, { 'ID': questionId });
        currentMessage.toggled = !currentMessage.toggled;
        if (currentMessage.Read) {
            messageApi.markQuestionAsUnread(questionId).then(function () { currentMessage.Read = false; })
        }
    }

    $scope.showMoveQuestion = function (questionId) {
        var currentMessage = _.find($scope.currentCategory.list, { 'ID': questionId })
        $scope.showModal = true;
        $scope.modalQuestion = currentMessage;
    };

    $scope.moveQuestionToCategory = function (categoryId, questionId) {
        messageApi.moveQuestionToCategory(questionId, categoryId).then(function () {
            var message = _.find($scope.currentCategory.list, { 'ID': questionId });
            //update categoryID
            message.CategoryID = categoryId;
            //remove question from source categories and add to destination
            var indexStart = $scope.currentCategory.list.indexOf(message);
            $scope.currentCategory.list.splice(indexStart, 1);
            var category = _.find($scope.categories, { 'ID': categoryId });
            var indexEnd = category.list.indexOf(message);
            if (indexEnd == -1) {
                category.list.push(message);
                message.toggled = false;
                //if open close modal...
                $scope.showModal = false;
            }
        });
    };

    //open close / sidebar 
    $scope.openInfoModal = function () {
        $scope.showInfoModal = true;
    };

    $scope.modifySidebar = function () {
        // funzione che apre lo sportello per modificare le categorie della sidebar
        $scope.sidebarModified = !$scope.sidebarModified;
    };

    //categories

    $scope.setCategory = function (categoryIndex) {
        $scope.currentCategoryIndex = categoryIndex + 1;
        $scope.currentCategory = $scope.categories[categoryIndex];
        $scope.activeCategory = categoryIndex;
    };

    $scope.deleteCategory = function (categoryId) {
        messageApi.deleteCategory(categoryId).then(function () {
            var category = _.find($scope.categories, { 'ID': categoryId });
            var index = $scope.categories.indexOf(category);
            $scope.categories.splice(index, 1);
        });
    };

    $scope.addMessage = function () {
        //add a message manually
        messageApi.addQuestion($scope.newMessage, 'MAN').then(function (question) {
            initQuestion(question);
            $scope.newMessage = '';
            //var inbox = _.find($scope.categories, { 'ID': INBOX });
            //$scope.questions.splice(0, 0, question);
            //inbox.list.splice(0, 0, question);
            //$scope.inboxLastID = question.ID;
            $scope.inbox.list.splice(0, 0, question);
            $scope.inboxLastID = question.ID;
            $scope.questions.splice(0, 0, question);

        });
    };

    $scope.addCategory = function () {
        //add a category manually
        messageApi.addCategory($scope.newCategory).then(function (category) {
            $scope.newCategory = '';
            category.list = [];
            $scope.categories.push(category);
        });
    };

    $scope.emptyTrash = function () {
        messageApi.emptyTrash().then(function () {
            var trash = _.find($scope.categories, { 'ID': TRASH });                        
            _.each(trash.list, function (question) {
                var question = _.find($scope.questions, { 'ID': question.ID });
                if (question) {
                    //remove all questions in all viewers?              
                    _.each(question.viewersID, function (viewerID) {
                        console.log(viewerID);
                        var viewer = _.find($scope.viewers, {'ID': viewerID});
                        _.remove(viewer.list, function (item) {
                            return item.ID == question.ID;
                        });
                    });
                    //remove questions from question list
                    if (question) {
                        _.remove($scope.questions, function (item) {
                            return item.ID == question.ID;
                        });
                    }
                }                
            });
            
            trash.list = [];
        });
    };

    $scope.setViewer = function (viewerID) {
        $scope.currentViewer = _.find($scope.viewers, { 'ID': viewerID });
    };

    $scope.moveQuestionToViewer = function (message, viewerId, orderIndex) {

        messageApi.insertQuestionToViewer(message.ID, viewerId).then(function () {
            var viewer = _.find($scope.viewers, { 'ID': viewerId });
            var index = _.map(viewer.list, function (item) { return item.ID; }).indexOf(message.ID);
            if (index == -1) {
                if (orderIndex !== undefined) {
                    //inserisce in mezzo alla lista
                    viewer.list.splice(orderIndex, 0, message);
                } else {
                    //inserisce alla fine
                    viewer.list.push(message);
                }
                message.viewersID.push(viewer.ID);
            }
            var newSort = _.map(viewer.list, function (item) { return item.ID; });
            messageApi.sortQuestionsInViewer(viewer.ID, newSort);
            $scope.currentViewer = viewer;
            message.toggled = false;
            $scope.showModal = false;
        });
    };

    $scope.orderInViewer = function (messageId, direction) {

        var message = _.find($scope.currentViewer.list, { 'ID': messageId });
        var index = _.map($scope.currentViewer.list, function (item) { return item.ID; }).indexOf(messageId);
        var otherIndex = index + direction;
        var otherObj = $scope.currentViewer.list[otherIndex];
        $scope.currentViewer.list[index] = otherObj;
        $scope.currentViewer.list[otherIndex] = message;
        // rimuovo la classe drag-enter nell'ordinamento via tasti
        //angular.element(document.querySelector('.drag-enter')).removeClass('drag-enter');
        var newSort = _.map($scope.currentViewer.list, function (item) { return item.ID; })
        messageApi.sortQuestionsInViewer($scope.currentViewer.ID, newSort);
    }

    $scope.deleteMessageFromViewer = function (messageId) {
        messageApi.removeQuestionFromViewer(messageId, $scope.currentViewer.ID).then(function () {
            var index = _.map($scope.currentViewer.list, function (item) { return item.ID; }).indexOf(messageId);
            if (index > -1) {
                //recupero il messaggio e gli tolgo la viewerid
                $scope.currentViewer.list.splice(index, 1);
                //recupero il messaggio e gli tolgo dalle viewers la viewer
                var message = _.find($scope.questions, { 'ID': messageId });
                if (message) {
                    var idx = message.viewersID.indexOf($scope.currentViewer.ID);
                    message.viewersID.splice(idx, 1);
                }
            }
        });
    };

    //inizio funzioni di drag and drop
    //funzione per l'ordinamento    

    $scope.currentDroppedType = null;

    $scope.onDragComplete = function (data, evt, source) {
        console.log(source);
        $scope.currentDroppedType = source;

    };

    $scope.insertInViewerOnDropComplete = function (index, message, evt, viewerId) {
        if ($scope.currentDroppedType !== 'currentViewer') {
            $scope.moveQuestionToViewer(message, viewerId);
        }
    };

    $scope.insertAndOrderOnDropComplete = function (index, message, evt, viewerId) {
        if ($scope.currentDroppedType !== 'currentViewer') {
            $scope.moveQuestionToViewer(message, viewerId, index);
        } else {
            var draggingMsgIndex = $scope.currentViewer.list.indexOf(message);
            // rimuovo il messaggio al suo indice corrente
            $scope.currentViewer.list.splice(draggingMsgIndex, 1);
            // inserisco il messaggio al nuovo indice
            $scope.currentViewer.list.splice(index, 0, message);
            var newSort = _.map($scope.currentViewer.list, function (item) { return item.ID; });
            messageApi.sortQuestionsInViewer($scope.currentViewer.ID, newSort);
        }
    }

    $scope.moveInCategoryOnDropComplete = function (message, evt, categoryId) {
        if ($scope.currentDroppedType != 'currentViewer') {
            $scope.moveQuestionToCategory(categoryId, message.ID);
        }
    }

    //questo non so cosa faccia al momento niente
    var inArray = function (array, obj) {
        var index = array.indexOf(obj);
    };

    // fine drag and drop
};
