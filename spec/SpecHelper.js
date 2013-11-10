beforeEach(function() {
    this.addMatchers({
        toBeInstanceOf: function(expectedInstance) {
            var actual = this.actual;
            if (typeof(actual) != 'Object') {
                actualName = typeof(actual);
            } else {
                var actualName = actual.constructor.name
            }
            var notText = this.isNot ? " not" : "";
            this.message = function() {
                return "Expected " + actualName + " is" + notText + " instance of " + expectedInstance.name;
            };
            return actual instanceof expectedInstance;
        }
    });
});
