angular.module('pokerPalApp')
.directive('photoUpload', function() {
    return {
        restrict: 'E',
        template: '<div>Photo upload directive - placeholder</div>',
        scope: {
            onPhotoSelected: '&'
        },
        link: function(scope, element, attrs) {
            // Placeholder photo upload directive
            console.log('Photo upload directive loaded - placeholder implementation');
        }
    };
});