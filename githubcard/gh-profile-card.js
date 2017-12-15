/** GitHub Profile Card - v2.0.1 **/

/*
 * Modified by Jihoon Lee to use in RWT
 */
(function(){
"use strict";
var CacheStorage = (function () {
    function CacheStorage() {
    }
    CacheStorage.get = function (key) {
        return CacheStorage.requestCache[key];
    };
    CacheStorage.add = function (url, entry) {
        CacheStorage.requestCache[url] = entry;
        window.localStorage.setItem(CacheStorage.cacheName, JSON.stringify(CacheStorage.requestCache));
    };
    CacheStorage.getCache = function () {
        return JSON.parse(window.localStorage.getItem(CacheStorage.cacheName));
    };
    return CacheStorage;
}());
CacheStorage.cacheName = 'github-request-cache';
CacheStorage.requestCache = CacheStorage.getCache() || {};

var GitHubApiLoader = (function () {
    function GitHubApiLoader() {
        this.apiBase = 'https://api.github.com';
    }
    GitHubApiLoader.prototype.loadUserData = function (username, callback) {
        var _this = this;
        var request = this.apiGet(this.apiBase + "/users/" + username);
        request.success(function (profile) {
            callback({ profile: profile }, null);
        });
        request.error(function (result, request) {
            var error = _this.identifyError(result, request);
            callback(null, error);
        });
    };
    GitHubApiLoader.prototype.identifyError = function (result, request) {
        var error = {
            message: result.message
        };
        if (request.status === 404) {
            error.isWrongUser = true;
        }
        var limitRequests = request.getResponseHeader('X-RateLimit-Remaining');
        if (Number(limitRequests) === 0) {
            var resetTime = request.getResponseHeader('X-RateLimit-Reset');
            error.resetDate = new Date(Number(resetTime) * 1000);
            // full message is too long, leave only general message
            error.message = error.message.split('(')[0];
        }
        return error;
    };
    GitHubApiLoader.prototype.apiGet = function (url) {
        var request = this.buildRequest(url);
        return {
            success: function (callback) {
                request.addEventListener('load', function () {
                    if (request.status === 304) {
                        callback(CacheStorage.get(url).data, request);
                    }
                    if (request.status === 200) {
                        var response = JSON.parse(request.responseText);
                        CacheStorage.add(url, {
                            lastModified: request.getResponseHeader('Last-Modified'),
                            data: response
                        });
                        callback(response, request);
                    }
                });
            },
            error: function (callback) {
                request.addEventListener('load', function () {
                    if (request.status !== 200 && request.status !== 304) {
                        callback(JSON.parse(request.responseText), request);
                    }
                });
            }
        };
    };
    GitHubApiLoader.prototype.buildRequest = function (url) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        this.buildApiHeaders(request, url);
        request.send();
        return request;
    };
    GitHubApiLoader.prototype.buildApiHeaders = function (request, url) {
        request.setRequestHeader('Accept', 'application/vnd.github.v3+json');
        var urlCache = CacheStorage.get(url);
        if (urlCache) {
            request.setRequestHeader('If-Modified-Since', urlCache.lastModified);
        }
    };
    return GitHubApiLoader;
}());

var DOMOperator = (function () {
    function DOMOperator() {
    }
    DOMOperator.clearChildren = function ($parent) {
        while ($parent.hasChildNodes()) {
            $parent.removeChild($parent.firstChild);
        }
    };
    DOMOperator.createError = function (error, username) {
        var $error = document.createElement('div');
        $error.className = 'error';
        $error.innerHTML = "<span>" + error.message + "</span>";
        if (error.isWrongUser) {
            $error.innerHTML = "<span>Not found user: " + username + "</span>";
        }
        if (error.resetDate) {
            var remainingTime = error.resetDate.getMinutes() - new Date().getMinutes();
            remainingTime = (remainingTime < 0) ? 60 + remainingTime : remainingTime;
            $error.innerHTML += "<span class=\"remain\">Come back after " + remainingTime + " minutes</span>";
        }
        return $error;
    };
    DOMOperator.createProfile = function (data) {
        var $followButton = followButton(data.login, data.html_url);
        var $followers = followers(data.followers);
        var $followContainer = followContainer([$followButton, $followers]);
        var $avatar = avatar(data.avatar_url);
        var $company =company(data.company);
        var $name = name(data.html_url, data.name);
        var $url = url(data.blog);
        return profile([$avatar, $name, $company, $followContainer]);
        //////////////////
        function appendChildren($parent, nodes) {
            nodes.forEach(function (node) { return $parent.appendChild(node); });
        }
        function profile(children) {
            var $profile = document.createElement('div');
            $profile.classList.add('profile');
            appendChildren($profile, children);
            return $profile;
        }
        function name(profileUrl, name) {
            var $name = document.createElement('a');
            $name.href = profileUrl;
            $name.className = 'name';
            $name.appendChild(document.createTextNode(name));
            return $name;
        }
        function avatar(avatarUrl) {
            var $avatar = document.createElement('img');
            $avatar.src = avatarUrl;
            $avatar.className = 'avatar';
            return $avatar;
        }
        function company(company_name) {
            var $company = document.createElement('div');
            if(company_name === null) {
              $company.appendChild(document.createElement('br'));
            }
            else {
              var name = company_name || '';
              $company.className= 'company';
              $company.appendChild(document.createTextNode(name));
            }
            return $company;
        }
        function url(blog_url) {
            var $url = document.createElement('a');
            $url.href = blog_url;
            $url.className = 'url';
            $url.appendChild(document.createTextNode(blog_url));
            return $url;
        }
        function followButton(username, followUrl) {
            var $followButton = document.createElement('a');
            $followButton.href = followUrl;
            $followButton.className = 'follow-button';
            $followButton.innerHTML = 'Follow @' + username;
            return $followButton;
        }
        function followers(followersAmount) {
            var $followers = document.createElement('span');
            $followers.className = 'followers';
            $followers.innerHTML = '' + followersAmount;
            return $followers;
        }
        function followContainer(children) {
            var $followContainer = document.createElement('div');
            $followContainer.className = 'followMe';
            appendChildren($followContainer, children);
            return $followContainer;
        }
    };
    DOMOperator.createAdditionalInformation = function (data) {
      // Fill it later
      return addition();

      function addtion() {
        return;
      }
    };

    DOMOperator.createTopLanguagesSection = function () {
        var $langsList = document.createElement('ul');
        $langsList.className = 'languages';
        return $langsList;
    };
    DOMOperator.createTopLanguagesList = function (langs) {
        return Object.keys(langs)
            .map(function (language) { return ({
            name: language,
            stat: langs[language]
        }); })
            .sort(function (a, b) { return b.stat - a.stat; })
            .slice(0, 3)
            .map(function (lang) { return "<li>" + lang.name + "</li>"; })
            .reduce(function (list, nextElement) { return list + nextElement; });
    };
    return DOMOperator;
}());

var GitHubCardWidget = (function () {
    function GitHubCardWidget(options) {
        if (options === void 0) { options = {}; }
        this.apiLoader = new GitHubApiLoader();
        this.$template = this.findTemplate(options.template);
        this.extractHtmlConfig(options, this.$template);
        this.options = this.completeConfiguration(options);
    }
    GitHubCardWidget.prototype.init = function () {
        var _this = this;
        this.apiLoader.loadUserData(this.options.username, function (data, err) {
            _this.userData = data;
            _this.render(_this.options, err);
        });
    };
    GitHubCardWidget.prototype.refresh = function (options) {
        this.options = this.completeConfiguration(options);
        this.render(this.options);
    };
    GitHubCardWidget.prototype.completeConfiguration = function (options) {
        var defaultConfig = {
            username: null,
            template: '#github-card',
            sortBy: 'stars',
            headerText: 'Most starred repositories',
            maxRepos: 5
        };
        for (var key in defaultConfig) {
            defaultConfig[key] = options[key] || defaultConfig[key];
        }
        return defaultConfig;
    };
    GitHubCardWidget.prototype.findTemplate = function (templateCssSelector) {
        if (templateCssSelector === void 0) { templateCssSelector = '#github-card'; }
        var $template = document.querySelector(templateCssSelector);
        if (!$template) {
            throw "No template found for selector: " + templateCssSelector;
        }
        $template.className += ' gh-profile-card';
        return $template;
    };
    GitHubCardWidget.prototype.extractHtmlConfig = function (widgetConfig, $template) {
        widgetConfig.username = widgetConfig.username || $template.dataset['username'];
        widgetConfig.sortBy = widgetConfig.sortBy || $template.dataset['sortBy'];
        widgetConfig.headerText = widgetConfig.headerText || $template.dataset['headerText'];
        widgetConfig.maxRepos = widgetConfig.maxRepos || parseInt($template.dataset['maxRepos'], 10);
        if (!widgetConfig.username) {
            throw 'Not provided username';
        }
    };
    GitHubCardWidget.prototype.render = function (options, error) {
        var $root = this.$template;
        // clear root template element to prepare space for widget
        DOMOperator.clearChildren($root);
        if (error) {
            var $errorSection = DOMOperator.createError(error, options.username);
            $root.appendChild($errorSection);
            return;
        }
        // API doesn't return errors, try to built widget
        var $profile = DOMOperator.createProfile(this.userData.profile);
        // $profile.appendChild(this.createAdditionalInformation(this.userData.profile));
        $root.appendChild($profile);
    };
    GitHubCardWidget.prototype.createAdditionalInformation= function (profile) {
        var _this = this;
        var $addition = DOMOperator.createAdditionalInformation(profile);
        return $addition;
    };
    GitHubCardWidget.prototype.groupLanguagesUsage = function (langStats) {
        var languagesRank = {};
        langStats.forEach(function (repoLangs) {
            for (var language in repoLangs) {
                languagesRank[language] = languagesRank[language] || 0;
                languagesRank[language] += repoLangs[language];
            }
        });
        return languagesRank;
    };
    GitHubCardWidget.prototype.dateDifference = function (first, second) {
        return new Date(first).getTime() - new Date(second).getTime();
    };
    return GitHubCardWidget;
}());

window.GitHubCard = GitHubCardWidget;
document.addEventListener('DOMContentLoaded', function () {
    var $defaultTemplate = document.getElementsByClassName('github-card');
    for(var i = 0; i < $defaultTemplate.length; i++) {
        var id = '#' + $defaultTemplate[i].id;
        var widget = new GitHubCardWidget({
          template: id
        });
        widget.init();
    }
});

/**
 * GitHub API interfaces based on documentation
 *
 * @see https://developer.github.com/v3/
 */



})();
