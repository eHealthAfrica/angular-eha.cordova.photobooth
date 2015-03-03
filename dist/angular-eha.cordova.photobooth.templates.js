;(function() {
  'use strict';
  /**
   *
   * @ngdoc directive
   * @name ehaPhotobooth
   * @module eha.cordova.directive.photobooth
   * @scope
   * @restrict E
   * @element ehaCordovaPhotobooth
   * @description
   * # Photobooth directive
   *
   * Front-end for apache.cordova.camera plugin
   *
   * Usage:
   *
   * <pre>
   *   <eha-photobooth model="photo" encoding-type="jpeg|png"></eha-photobooth>
   * </pre>
   *
   * Where:
   *   - **model** is the object where you would like to output photo data
   *   - **encoding-type** image encoding type. Currently only jpeg & png
   *     supported.
   */
  var ngModule = angular.module('eha.cordova.directive.photobooth', [
    'eha.cordova.service.camera',
    'templates/cordova.photobooth.directive.tpl.html'
  ])
  .value('navigator', navigator)
  .value('document', document)
  .directive('ehaCordovaPhotobooth', ['ehaCordovaCamera', '$log', '$window', 'document', '$timeout', 'navigator', function(
    ehaCordovaCamera,
    $log,
    $window,
    document,
    $timeout,
    navigator
  ) {
    return {
      restrict: 'E',
      scope: {
        model: '=model',
        encodingType: '@encodingType'
      },
      templateUrl: 'templates/cordova.photobooth.directive.tpl.html',
      link: function(scope) {
        // ng-if creates it's own scope, which causes problems with simple
        // properties, so should create use a 'complex' object instead
        var vm = scope.vm = {};
        var options = {
          encoding: 'base64',
          encodingType: 0, // 0: JPEG  1: PNG
          mimeType: 'image/jpeg'
        };

        vm.hasCamera = false;

        // Check @encodingType attribute
        if (scope.encodingType === 'png') {
          options.encodingType = 1;
          options.mimeType = 'image/png';
        } else if (scope.encodingType !== 'jpeg') {
          $log.error('Invalid encoding type. "' +
                     vm.encodingType +
                     '" is not supported');
        }

        document.addEventListener('deviceready', function() {
          if (navigator.camera) {
            vm.hasCamera = true;
          }
        });

        var getDataUri = function(picture) {
          return encodeURI('data:' +
                           options.mimeType + ';' +
                           options.encoding + ',' +
                           picture);
        };

        var getEncodingType = function() {
          return options.encodingType === 0 ? 'jpeg' : 'png';
        };

        vm.getPicture = function() {
          ehaCordovaCamera.getPicture(options)
          .then(function(picture) {
            vm.uri = getDataUri(picture);
            scope.model = {
              mimeType: options.mimeType,
              encoding: options.encoding,
              encodingType: getEncodingType(),
              data: picture
            };
          })
          .catch(function(err) {
            if (err) {
              $log.error(err);
              $window.alert(err);
            }
          });
        };

        vm.removePicture = function() {
          vm.uri = null;
        };
      }
    };
  }]);

  // Check for and export to commonjs environment
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ngModule;
  }

}());

angular.module('eha.cordova.photobooth.templates', ['templates/cordova.photobooth.directive.tpl.html']);

angular.module("templates/cordova.photobooth.directive.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/cordova.photobooth.directive.tpl.html",
    "<div class=\"component photobooth\">\n" +
    "  <div ng-if=\"vm.hasCamera\">\n" +
    "    <div ng-if=\"vm.uri\">\n" +
    "      <img\n" +
    "      src=\"{{vm.uri}}\"\n" +
    "      alt=\"\"\n" +
    "      ng-if=\"vm.uri\"\n" +
    "      class=\"picture\" />\n" +
    "      <br />\n" +
    "    </div>\n" +
    "    <button\n" +
    "      class=\"btn btn-block btn-primary\"\n" +
    "      type=\"button\"\n" +
    "      ng-click=\"vm.getPicture()\">\n" +
    "      <i class=\"fa fa-camera\"></i>\n" +
    "      <span ng-if=\"!vm.uri\" translate>Take Photo</span>\n" +
    "      <span ng-if=\"vm.uri\" translate>Re-take Photo</span>\n" +
    "    </button>\n" +
    "    <button\n" +
    "      class=\"btn btn-block btn-secondary\"\n" +
    "      type=\"button\"\n" +
    "      ng-if=\"vm.uri\"\n" +
    "      ng-click=\"vm.removePicture()\">\n" +
    "      <span translate>Remove Photo</span>\n" +
    "    </button>\n" +
    "  </div>\n" +
    "  <div ng-if=\"!vm.hasCamera\">\n" +
    "    <div class=\"alert alert-info\"><span translate>Camera Module Not Found. Unable to take photograph.</span></div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);
