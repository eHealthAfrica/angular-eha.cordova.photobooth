/*jshint expr: true*/
/*jscs maximumLineLength: 120 */
describe('<eha-photobooth/> directive', function() {
  'use strict';
  var element;
  var scope;
  var compile;
  var $httpBackend;
  var gettextCatalog;

  var gettextCatalogMock = {
    getString: function(str) {
      return str;
    }
  };

  describe('Camera module not available', function() {
    beforeEach(module('templates/cordova.photobooth.directive.tpl.html'));
    beforeEach(module('eha.cordova.directive.photobooth', function($provide) {
      $provide.value('gettextCatalog', gettextCatalogMock);
    }));

    beforeEach(inject(function(_$rootScope_, _$compile_, _gettextCatalog_) {
      gettextCatalog = _gettextCatalog_;

      scope = _$rootScope_.$new();
      compile = _$compile_;

      element = angular
                .element('<eha-cordova-photobooth model="photo">' +
                         '</eha-cordova-photobooth>');

      compile(element)(scope);
      scope.$digest();
    }));

    it('should display a warning that the camera module is not available',
       function() {
        var $el =  angular
                    .element(element.find('div')[0]
                    .querySelector('.alert'));

        expect($el.hasClass('alert')).to.be.truthy;
        expect($el.text())
          .to
          .equal(gettextCatalog
                   .getString('Camera Module Not Found. ' +
                              'Unable to take photograph.'));
      });
  });

  describe('Camera module available', function() {
    var PICTURE_DATA = '!!!PICTURE DATA!!!';
    var eventListenerCb;
    var nav;

    var documentMock = {
      addEventListener: function(eventName, callback) {
        if (eventName === 'deviceready') {
          eventListenerCb = callback;
          callback();
        }
      }
    };

    var cameraServiceMock = {
      getPicture: function() {
        return {
          'then': function(callback) {
            callback(PICTURE_DATA);
            return {
              'catch': sinon.spy()
            };
          }
        };
      }
    };

    var navigatorMock = {
      camera: {
        getPicture: function() {}
      }
    };

    var gettextCatalogMock = {
      getString: function(str) {
        return str;
      }
    };

    var $logMock = {
      error: sinon.spy()
    };

    var $windowMock = {
      alert: sinon.spy()
    };

    beforeEach(function() {
      sinon.spy(documentMock, 'addEventListener');
      sinon.spy(cameraServiceMock, 'getPicture');
      sinon.spy(cameraServiceMock.getPicture(), 'then');
      sinon.spy(gettextCatalogMock, 'getString');
    });

    afterEach(function() {
      documentMock.addEventListener.restore();
      cameraServiceMock.getPicture.restore();
      gettextCatalogMock.getString.restore();
    });

    beforeEach(module('eha.cordova.service.camera',
      function($provide) {
        $provide.value('navigator', navigatorMock);
      }));

    beforeEach(module('eha.cordova.directive.photobooth',
      function($provide) {
        $provide.value('document', documentMock);
        $provide.value('ehaCordovaCamera', cameraServiceMock);
        $provide.value('$window', $windowMock);
        $provide.value('$log', $logMock);
        $provide.value('gettextCatalog', gettextCatalogMock);
        $provide.value('navigator', navigatorMock);
      }));

    beforeEach(inject(function(_$rootScope_,
                               _$compile_,
                               _gettextCatalog_,
                               _$httpBackend_,
                               _navigator_) {
      scope = _$rootScope_.$new();
      compile = _$compile_;
      gettextCatalog = _gettextCatalog_;
      $httpBackend = _$httpBackend_;
      nav = _navigator_;

      $httpBackend
      .expectGET('templates/cordova.photobooth.directive.tpl.html')
      .respond();

      element = angular
                  .element(
                    '<eha-cordova-photobooth model="photo">' +
                    '</eha-cordova-photobooth>');

      compile(element)(scope);
    }));

    it('should listen to deviceready event and configure vm', function() {
      scope.$digest();
      expect(documentMock.addEventListener)
      .to
      .have
      .been
      .calledWith('deviceready', eventListenerCb);

      var $el = angular.element(element);
      var $scope = $el.isolateScope();
      var vm = $scope.vm;
      expect(vm.hasCamera).to.be.truthy;
    });

    it('should render a "Take Photo" button', function() {
      scope.$digest();
      var $el = angular
                  .element(element.find('button')[0]);

      expect($el.text().trim())
        .to.equal(gettextCatalog.getString('Take Photo'));
    });

    it('should call camera.getPicture() when button is pressed', function() {
      scope.$digest();
      var el = element.find('button')[0];
      el.click();
      expect(cameraServiceMock.getPicture).to.have.been.called;
    });

    it('should handle a picture returned from apache.cordova.camera',
       function() {
         scope.$digest();
         var $scope = element.isolateScope();
         var vm = $scope.vm;
         var expectedUri = encodeURI('data:image/jpeg;base64,' +
                                     '!!!PICTURE DATA!!!');
         vm.getPicture();
         $scope.$digest();

         // Check the viewmodel
         expect(vm.uri).to.equal(expectedUri);
         expect($scope.model.mimeType).to.equal('image/jpeg');
         expect($scope.model.encodingType).to.equal('jpeg');
         expect($scope.model.encoding).to.equal('base64');
         expect($scope.model.data).to.equal(PICTURE_DATA);

         // Check it rendered
         var $el = element.find('img');
         expect($el[0].src).to.equal(expectedUri);
       });

    it('should handle supported options passed by attr', function() {
      element = angular.element('<eha-cordova-photobooth encoding-type="png">' +
                                '</eha-cordova-photobooth>');
      compile(element)(scope);
      scope.$digest();

      var $scope = element.isolateScope();
      var vm = $scope.vm;
      var expectedUri = encodeURI('data:image/png;base64,' + PICTURE_DATA);
      vm.getPicture();
      $scope.$digest();

      // Check the viewmodel
      expect(vm.uri).to.equal(expectedUri);
      expect($scope.model.mimeType).to.equal('image/png');
      expect($scope.model.encodingType).to.equal('png');
      expect($scope.model.encoding).to.equal('base64');
      expect($scope.model.data).to.equal(PICTURE_DATA);

      // Check it rendered
      var $el = element.find('img');
      expect($el[0].src).to.equal(expectedUri);

    });

    it('button label should change to "Re-take Photo"', function() {
      scope.$digest();
      var $scope = element.isolateScope();
      var vm = $scope.vm;

      vm.getPicture();
      $scope.$digest();

      var $el = angular.element(element.find('button')[0]);
      expect($el.text().trim())
        .to
        .equal(gettextCatalog.getString('Re-take Photo'));
    });

    it('should show "Remove Photo" button after a picture has been taken',
       function() {
         scope.$digest();
         var $scope = element.isolateScope();
         var vm = $scope.vm;

         vm.getPicture();
         $scope.$digest();

         var $el = angular.element(element.find('button')[1]);
         expect($el.text().trim())
          .to
          .equal(gettextCatalog.getString('Remove Photo'));
       });

    it('Clicking "Remove Photo" button removes photo', function() {
      scope.$digest();
      var $scope = element.isolateScope();
      var vm = $scope.vm;

      vm.getPicture();
      $scope.$digest();

      var el = element.find('button')[1];
      el.click();
      $scope.$digest();

      expect(vm.uri).to.be.falsy;
      expect(el.src).to.be.falsy;
    });
  });
});
