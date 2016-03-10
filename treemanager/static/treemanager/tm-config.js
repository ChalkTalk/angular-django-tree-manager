angular.module('tmConfig', [])
.constant('STATIC_URL', '{{ STATIC_URL }}')
.config(['$httpProvider', '$sceDelegateProvider', 'STATIC_URL',
  function($httpProvider, $sceDelegateProvider, STATIC_URL) {

    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $httpProvider.defaults.headers.post['X-Requested-With'] = 'XMLHttpRequest';
    $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      STATIC_URL + '**'
    ]);
  }
]);