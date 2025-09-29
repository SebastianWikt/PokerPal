// PokerPal AngularJS Application
angular
  .module("pokerPalApp", ["ngRoute"])

  .config([
    "$routeProvider",
    function ($routeProvider) {
      $routeProvider
        .when("/", {
          templateUrl: "views/login.html",
          controller: "LoginController",
          resolve: {
            redirectIfAuthenticated: [
              "AuthService",
              "$location",
              "$q",
              function (AuthService, $location, $q) {
                if (AuthService.isAuthenticated()) {
                  $location.path("/home");
                  return $q.reject("Already authenticated");
                }
                return $q.resolve();
              },
            ],
          },
        })
        .when("/home", {
          templateUrl: "views/home.html",
          controller: "HomeController",
          resolve: {
            requireAuth: [
              "AuthService",
              "$location",
              "$q",
              function (AuthService, $location, $q) {
                if (!AuthService.isAuthenticated()) {
                  $location.path("/");
                  return $q.reject("Authentication required");
                }
                return $q.resolve();
              },
            ],
          },
        })
        .when("/profile/create", {
          templateUrl: "views/profile-create.html",
          controller: "ProfileController",
        })
        .when("/profile/edit", {
          templateUrl: "views/profile-edit.html",
          controller: "ProfileController",
          resolve: {
            requireAuth: [
              "AuthService",
              "$location",
              "$q",
              function (AuthService, $location, $q) {
                if (!AuthService.isAuthenticated()) {
                  $location.path("/");
                  return $q.reject("Authentication required");
                }
                return $q.resolve();
              },
            ],
          },
        })
        .when("/session", {
          templateUrl: "views/session.html",
          controller: "SessionController",
          resolve: {
            requireAuth: [
              "AuthService",
              "$location",
              "$q",
              function (AuthService, $location, $q) {
                if (!AuthService.isAuthenticated()) {
                  $location.path("/");
                  return $q.reject("Authentication required");
                }
                return $q.resolve();
              },
            ],
          },
        })
        .when("/leaderboard", {
          templateUrl: "views/leaderboard.html",
          controller: "LeaderboardController",
          resolve: {
            requireAuth: [
              "AuthService",
              "$location",
              "$q",
              function (AuthService, $location, $q) {
                if (!AuthService.isAuthenticated()) {
                  $location.path("/");
                  return $q.reject("Authentication required");
                }
                return $q.resolve();
              },
            ],
          },
        })
        .when("/admin", {
          templateUrl: "views/admin.html",
          controller: "AdminController",
          resolve: {
            requireAdmin: [
              "AuthService",
              "$location",
              "$q",
              function (AuthService, $location, $q) {
                if (!AuthService.isAuthenticated()) {
                  $location.path("/");
                  return $q.reject("Authentication required");
                }
                if (!AuthService.isAdmin()) {
                  $location.path("/home");
                  return $q.reject("Admin privileges required");
                }
                return $q.resolve();
              },
            ],
          },
        })
        .otherwise({
          redirectTo: "/",
        });
    },
  ])

  .run([
    "$rootScope",
    "$location",
    "AuthService",
    function ($rootScope, $location, AuthService) {
      // Initialize authentication state on app start
      AuthService.initializeAuth();

      // Ensure we're on a valid route
      if ($location.path() === "") {
        $location.path("/");
      }

      // Listen for route change errors
      $rootScope.$on(
        "$routeChangeError",
        function (event, current, previous, rejection) {
          console.error("Route change error:", rejection);
        }
      );

      // Set up global error handling
      $rootScope.$on("$routeChangeStart", function (event, next, current) {
        // Show loading indicator if needed
        $rootScope.loading = true;
      });

      $rootScope.$on(
        "$routeChangeSuccess",
        function (event, current, previous) {
          // Hide loading indicator
          $rootScope.loading = false;
        }
      );
    },
  ])

  .constant(
    "API_BASE_URL",
    window.ENV_CONFIG
      ? window.ENV_CONFIG.apiBaseUrl
      : "http://localhost:3000/api"
  )

  .constant("ENV_CONFIG", window.ENV_CONFIG || {})

  .config([
    "$httpProvider",
    function ($httpProvider) {
      // Add JWT token to all HTTP requests
      $httpProvider.interceptors.push([
        "AuthService",
        "$location",
        "$q",
        function (AuthService, $location, $q) {
          return {
            request: function (config) {
              var token = AuthService.getToken();
              if (token) {
                config.headers.Authorization = "Bearer " + token;
              }
              return config;
            },
            responseError: function (response) {
              if (response.status === 401) {
                AuthService.logout().then(function () {
                  $location.path("/");
                });
              }
              return $q.reject(response);
            },
          };
        },
      ]);

      // Add error interceptor
      $httpProvider.interceptors.push("ErrorInterceptor");
    },
  ]);
