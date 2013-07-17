YUI.add('module-tests', function(Y) {

    var suite = new Y.Test.Suite('myothermodule');
    suite.myArray = ["one", "two", "three"]

    suite.add(new Y.Test.Case({
        name: 'Automated Tests',
        'test one': function() {
           Y.Assert.areSame('one', suite.myArray[0]); 
        },
        'test two': function() {
           Y.Assert.areSame('two', suite.myArray[1]); 
        },
        'test three': function() {
           Y.Assert.areSame('three', suite.myArray[2]); 
        }
    }));

    Y.Test.Runner.add(suite);


},'', { requires: [ 'test' ] });
