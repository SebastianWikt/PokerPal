// Custom Jasmine matchers for E2E tests
module.exports = {
  toBeDisplayed: function() {
    return {
      compare: function(actual) {
        var result = {};
        
        return actual.isDisplayed().then(function(displayed) {
          result.pass = displayed;
          
          if (result.pass) {
            result.message = 'Expected element not to be displayed, but it was displayed';
          } else {
            result.message = 'Expected element to be displayed, but it was not displayed';
          }
          
          return result;
        });
      }
    };
  },
  
  toHaveText: function() {
    return {
      compare: function(actual, expected) {
        var result = {};
        
        return actual.getText().then(function(actualText) {
          result.pass = actualText === expected;
          
          if (result.pass) {
            result.message = 'Expected element not to have text "' + expected + '", but it did';
          } else {
            result.message = 'Expected element to have text "' + expected + '", but it had "' + actualText + '"';
          }
          
          return result;
        });
      }
    };
  },
  
  toContainText: function() {
    return {
      compare: function(actual, expected) {
        var result = {};
        
        return actual.getText().then(function(actualText) {
          result.pass = actualText.indexOf(expected) !== -1;
          
          if (result.pass) {
            result.message = 'Expected element not to contain text "' + expected + '", but it did';
          } else {
            result.message = 'Expected element to contain text "' + expected + '", but it had "' + actualText + '"';
          }
          
          return result;
        });
      }
    };
  },
  
  toHaveClass: function() {
    return {
      compare: function(actual, expected) {
        var result = {};
        
        return actual.getAttribute('class').then(function(classes) {
          var classList = classes ? classes.split(' ') : [];
          result.pass = classList.indexOf(expected) !== -1;
          
          if (result.pass) {
            result.message = 'Expected element not to have class "' + expected + '", but it did';
          } else {
            result.message = 'Expected element to have class "' + expected + '", but it had classes: ' + classes;
          }
          
          return result;
        });
      }
    };
  },
  
  toHaveValue: function() {
    return {
      compare: function(actual, expected) {
        var result = {};
        
        return actual.getAttribute('value').then(function(actualValue) {
          result.pass = actualValue === expected;
          
          if (result.pass) {
            result.message = 'Expected element not to have value "' + expected + '", but it did';
          } else {
            result.message = 'Expected element to have value "' + expected + '", but it had "' + actualValue + '"';
          }
          
          return result;
        });
      }
    };
  },
  
  toBeEnabled: function() {
    return {
      compare: function(actual) {
        var result = {};
        
        return actual.isEnabled().then(function(enabled) {
          result.pass = enabled;
          
          if (result.pass) {
            result.message = 'Expected element not to be enabled, but it was enabled';
          } else {
            result.message = 'Expected element to be enabled, but it was disabled';
          }
          
          return result;
        });
      }
    };
  },
  
  toBeSelected: function() {
    return {
      compare: function(actual) {
        var result = {};
        
        return actual.isSelected().then(function(selected) {
          result.pass = selected;
          
          if (result.pass) {
            result.message = 'Expected element not to be selected, but it was selected';
          } else {
            result.message = 'Expected element to be selected, but it was not selected';
          }
          
          return result;
        });
      }
    };
  },
  
  toHaveCount: function() {
    return {
      compare: function(actual, expected) {
        var result = {};
        
        return actual.count().then(function(actualCount) {
          result.pass = actualCount === expected;
          
          if (result.pass) {
            result.message = 'Expected element count not to be ' + expected + ', but it was';
          } else {
            result.message = 'Expected element count to be ' + expected + ', but it was ' + actualCount;
          }
          
          return result;
        });
      }
    };
  }
};