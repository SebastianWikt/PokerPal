// PokerPal AngularJS Application - Fixed Version
angular
  .module("pokerPalApp", ["ngRoute"])

  .constant("API_BASE_URL", window.ENV_CONFIG ? window.ENV_CONFIG.apiBaseUrl : "http://localhost:3000/api")
  .constant("ENV_CONFIG", window.ENV_CONFIG || {})

  .config([
    "$routeProvider",
    function ($routeProvider) {
      $routeProvider
        .when("/", {
          templateUrl: "views/login.html",
          controller: "LoginController",
          resolve: {
            redirectIfAuthenticated: [
              "$location",
              "$q",
              function ($location, $q) {
                var token = localStorage.getItem('pokerpal_token');
                if (token) {
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
              "$location",
              "$q",
              function ($location, $q) {
                var token = localStorage.getItem('pokerpal_token');
                if (!token) {
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
          controller: "ProfileController"
        })
        .when("/profile/edit", {
          templateUrl: "views/profile-edit.html",
          controller: "ProfileController",
          resolve: {
            requireAuth: [
              "$location",
              "$q",
              function ($location, $q) {
                var token = localStorage.getItem('pokerpal_token');
                if (!token) {
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
              "$location",
              "$q",
              function ($location, $q) {
                var token = localStorage.getItem('pokerpal_token');
                if (!token) {
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
              "$location",
              "$q",
              function ($location, $q) {
                var token = localStorage.getItem('pokerpal_token');
                if (!token) {
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
              "$location",
              "$q",
              function ($location, $q) {
                var token = localStorage.getItem('pokerpal_token');
                var user = localStorage.getItem('pokerpal_user');
                
                if (!token) {
                  $location.path("/");
                  return $q.reject("Authentication required");
                }
                
                try {
                  var userData = JSON.parse(user);
                  if (!userData.is_admin) {
                    $location.path("/home");
                    return $q.reject("Admin privileges required");
                  }
                } catch (e) {
                  $location.path("/");
                  return $q.reject("Invalid user data");
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
      console.log('PokerPal app started successfully');
      
      // Initialize authentication state on app start
      AuthService.initializeAuth();
      
      // Ensure we're on a valid route
      if ($location.path() === '') {
        $location.path('/');
      }

      // Listen for route change errors
      $rootScope.$on("$routeChangeError", function (event, current, previous, rejection) {
        console.error("Route change error:", rejection);
        // Don't redirect on auth errors, let the resolve handle it
      });

      // Set up global error handling
      $rootScope.$on("$routeChangeStart", function (event, next, current) {
        $rootScope.loading = true;
      });

      $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        $rootScope.loading = false;
      });
    },
  ])

  .config([
    "$httpProvider",
    function ($httpProvider) {
      // Add JWT token to all HTTP requests
      $httpProvider.interceptors.push([
        "$q",
        function ($q) {
          return {
            request: function (config) {
              var token = localStorage.getItem('pokerpal_token');
              if (token) {
                config.headers.Authorization = "Bearer " + token;
              }
              return config;
            },
            responseError: function (response) {
              if (response.status === 401) {
                localStorage.removeItem('pokerpal_token');
                localStorage.removeItem('pokerpal_user');
                window.location.hash = '#!/';
              }
              return $q.reject(response);
            },
          };
        },
      ]);

      // Add error interceptor (loaded after ErrorService is available)
      $httpProvider.interceptors.push("ErrorInterceptor");
    },
  ]);