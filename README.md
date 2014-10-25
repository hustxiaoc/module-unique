module-unique
=============

a patch for node.js which avoids loading the same module more than once

### why?
In a large project developed with node.Js, some modules are used frequently, let's say underscore or lodash.
module A is depended on ```underscore```,and module B is depended on it too, they are depended on the same version. 
So module underscore is loaded more than once , right? And that may cost a lot memory, very unnecessary .So why don't 
we set the cache for the same module with the same version. Well , module-unique can help you solve this!

### How to use
```npm install module-unique```

add the code before your own code, must before or it won't work!!!
```js
require('module-unique').init();
```
here is a example code
```
#!/usr/bin/env node
'use strict';

var unique = require('module-unique');
unique.init();

var app = require('../app'),
    logger = require('logger'),
    graceful = require('graceful');

app.set('port', process.env.PORT);

var server = app.listen(app.get('port'), function() {
    logger.info('server listening on port ' + server.address().port);
});

graceful({
    server: server,
    killTimeout: 30 * 1000,
    error: function(err, throwErrorCount) {
        if (err.message) {
            err.message +=
                ' (uncaughtException throw ' + throwErrorCount +
                ' times on pid:' + process.pid + ')';
        }
        logger.error(err);
    }
});
```

memory saved  about 30% above in my own project!


#### before using module-unique
![http://gtms02.alicdn.com/tps/i2/TB1OBmVGFXXXXaZXXXXhN4IGpXX-930-98.png](http://gtms02.alicdn.com/tps/i2/TB1OBmVGFXXXXaZXXXXhN4IGpXX-930-98.png)

#### after using module-unique
![http://gtms03.alicdn.com/tps/i3/TB1nU9QGFXXXXb4XFXXDeGnJXXX-886-144.png](http://gtms03.alicdn.com/tps/i3/TB1nU9QGFXXXXb4XFXXDeGnJXXX-886-144.png)