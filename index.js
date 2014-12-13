var redisObservedOptions = {};
var redisUpdatesOptions = {};

if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    console.log(env);
    redisObservedOptions = {
        redis: {
            port: env['rediscloud'][0].credentials.port,
            host: env['rediscloud'][0].credentials.hostname,
            auth: env['rediscloud'][0].credentials.password
        }
    };
    // console.log('observed queue host: '+redisObservedOptions.redis.host +
    //     ', password:' +redisObservedOptions.redis.options.auth_pass);
    redisUpdatesOptions = {
        redis: {
            port: env['rediscloud'][1].credentials.port,
            host: env['rediscloud'][1].credentials.hostname,
            auth: env['rediscloud'][1].credentials.password
        }
    };
    // console.log('observed updated options: ');
    // console.log(redisUpdatesOptions.redis.host);
    // console.log(redisUpdatesOptions.redis.options.auth_pass);
} else {
    console.log('esecuzione locale');
    redisObservedOptions = {};
    redisUpdatesOptions = {};
}

var kue = require('kue'),
    observedTrains = kue.createQueue(redisObservedOptions),
    trainUpdates = kue.createQueue(redisUpdatesOptions);

var serverUrl = 'http://API_EZIO/state/startCodeStation/numTreno';

// var job = observedTrains.create('train', {
//     trainNumber: '6572',
//     stationCode: 'S0000'
// }).save( function(err){
//     if( !err ) console.log( job.id );
// });

observedTrains.process('train', function(job, done){
    train(job.data, done);
});

function train(trainObj, done) {
    /* se NON è ancora arrivato
     * lo mette in coda di nuovo
     */
    var isArrivato = true;
    if(!isArrivato) {
        observedTrains.create('train', trainObj).save( function(err){
            if( !err ) {
                console.log( trainObj.id );
            }
        });
    }

    // aggiungo nell'altra coda tutto l'oggetto trainObj
    trainUpdates.create('train', trainObj).save( function(err){
        if( !err ) {
            console.log( trainObj.id );
        }
    });

    done();
}

process.once('SIGTERM', function ( sig ) {
    queue.shutdown(function(err) {
        console.log( 'Kue is shut down.', err||'' );
        process.exit( 0 );
    }, 5000 );
});
var port=process.env.VCAP_APP_PORT || 1337;
var host=process.env.VCAP_APP_HOST || 'localhost';
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(port, host);
console.log('Server running at http://127.0.0.1:1337/');

