var chattybin = angular.module('chattybin', []);
chattybin.controller('AppHub', function ($scope, $http, $interval, $window) {
    domain = "http://localhost:5555";
    $scope.loginError = false;
    $scope.nullError = false;
    $scope.loginVisible = true;
    $scope.conversationVisible = false;
    $scope.clear = function() {
        this.credentials.username = '';
        this.credentials.password = '';
    }
    var config = {};
    $scope.login = function (credentials) {
        if ((credentials.username != "" && credentials.username != undefined) && (credentials.password != "" && credentials.password != undefined)) {
            $http.post(domain + '/users/login',
                {
                    username: credentials.username,
                    password: credentials.password
                },{ withCredentials: true })
                .then(function (success) {
                    if (success.data.status == "Successful Login") {
                        $scope.loginError = false;
                        $scope.loginVisible = false;
                        $scope.nullError = false;
                        $scope.credentials = {};
                        config = {
                            headers: {
                                'Authorization': 'bearer ' + success.data.token
                            },
                            withCredentials: true
                        };
                        getuserinfo(config);
                        
                    }
                }, function (error) {
                    $scope.nullError = false;
                    $scope.loginError = true;
                });
        } else {
            $scope.loginError = false;
            $scope.nullError = true;
        }
    };

    function getuserinfo(config) {
        $http.get(domain + '/users/getuserinfo', config )
            .then(function (success) {
                $scope.content = success.data;
                $scope.myfriends = success.data.friends;
                checkNewMsgNumInterval = $interval(checkNewMsgNum, 1000);
            }, function (error) {
                console.log('Error: ' + error);
            });
        
    };

    $scope.logout = function () {
        $http.get(domain + '/users/logout', config)
            .then(function (success) {
                if (success.data == 'Logout Success!') {
                    $scope.loginVisible = true;
                    $scope.conversationVisible = false;
                    $scope.conversationData = {};
                    $scope.content = '';
                    $scope.myfriends = [];
                    currentFriendId = '';
                    $scope.credentials = {};
                    config = {};
                    $scope.messageArea = "Type a message here";
                }
                else {
                    console.log('An error has occurred!');
                    checkNewMsgNumInterval = $interval(checkNewMsgNum, 1000);
                }
            }, function (error) {
                console.log('Error: ' + error);
                checkNewMsgNumInterval = $interval(checkNewMsgNum, 1000);
            });
    };
    var currentFriendId = "";
    var UpdateConversation;
    $scope.getConversation = function (friendId) {
        $scope.conversationVisible = true;
        $interval.cancel(UpdateConversation);
        currentFriendId = friendId;
        $http.get(domain + '/users/getconversation/' + friendId, config).then(function (success) {
            $scope.conversationData = success.data;
            $scope.conversationVisible = true;
            $scope.messageArea = "Type a message here";
            UpdateConversation = $interval(function () {
                if ($scope.conversationVisible) {
                    $http.get(domain + '/users/getnewmessages/' + friendId, config).then(function (success) {
                        $scope.conversationData.status = success.data.status;
                        $scope.conversationData.messages = $scope.conversationData.messages.concat(success.data.newmsg);
                        updateScroll();
                    }, function (error) { console.log("Error: " + error); });
                } else {
                    $interval.cancel();
                }
            }, 5000);
        }, function (error) { console.log("Error: " + error) ;});
    };


    $scope.sendMessage = function (messageArea, friendId) {
        $http.post(domain + '/users/postmessage/' + friendId, { message: messageArea, }, config).then(function (success) {
            let date = new Date(success.data.createdAt);
            if ("_id" in success.data) {
                $scope.conversationData.messages.push({
                    receiverSerial: success.data.receiverSerial,
                    senderSerial: success.data.senderSerial,
                    date: date.toDateString(),
                    time: date.toTimeString().split(' ')[0],
                    message: messageArea,
                    serial: success.data.serial
                });
                $scope.messageArea = "Type a message here";
            }
        }, function (error) { console.log("Error: " + error) });
    };

    $scope.deleteMessage = function (messageId, sr) {
        console.log(messageId);
        console.log(sr);
        if (confirm("Delete the message?")) {
            $http.delete(domain + '/users/deletemessage/' + messageId, config).then(function (success) {
                if (success.data == 'successfully deleted') {
                    $scope.getConversation(sr);
                    console.log('deleted');
                }
                else if (success.data == 'failed to delete') {
                    console.log('You are not authorized to delete the message!');
                }
            }, function (error) { console.log("Error: " + error) });
        }
    };

    
    checkNewMsgNum = function () {
        if (!$scope.loginVisible) {
            $scope.myfriends.forEach(function (friend) {
                if (friend.serial != currentFriendId) {
                    $http.get(domain + '/users/getnewmsgnum/' + friend.serial, config).then(
                        function (success) {
                            for (var i = 0; i < $scope.myfriends.length; i++) {
                                if ($scope.myfriends[i].serial == friend.serial) {
                                    var info = {};
                                    info = $scope.myfriends[i];
                                    info.unread = success.data.unread;
                                    $scope.myfriends[i] = info;
                                    break;
                                }
                            }
                        }, function (error) {
                            console.log("Error: " + error)
                        });
                } else {
                    for (var i = 0; i < $scope.myfriends.length; i++) {
                        if ($scope.myfriends[i].serial == friend.serial) {
                            $scope.myfriends[i].unread = '';
                            break;
                        }
                    }
                }
            });
        }
    }
    checkNewMsgNumInterval = $interval(checkNewMsgNum, 1000);
    

    var previousDate = '';
    $scope.checkDate = function (message) {
        if (message.date == previousDate && message.serial == $scope.conversationData.messages[0].serial) {
            previousDate = message.date
            return true;
        }
        else if (message.date == previousDate) {
            return false;
        }
        else {
            previousDate = message.date;
            return true;
        }
    };

    function updateScroll() {
        var element = angular.element(document.getElementById("#chat"));
        element.scrollTop = element.scrollHeight;
    }
});