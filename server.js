var net = require('net');

var indoorServer;
var unityServer;
var unityClient;

/**
 * Recive location from IndoorAtlas
 */
indoorServer = net.createServer(onIndoorAtlasClientConnected);
indoorServer.listen(7777,function(err) {
    if (err) throw err;
    
    console.log('indooratlas server started: %s:%d', unityServer.address().address, unityServer.address().port);
})

/**
 * Send postion to Unity
 */
unityServer = net.createServer(onUnityClientConnected);
unityServer.listen(7778, function onServerStarted(err) {
    if (err) throw err;
    
    console.log('unity server started: %s:%d', unityServer.address().address, unityServer.address().port);
});

function onIndoorAtlasClientConnected(client) {
    console.log('indooratlas connected');
    
    client.on('end', function() {
        console.log('indooratlas disconnected');
    });
    
    client.on('error', function(err) {
        client.end();
    });
    
    client.on('data', function (data) {
        console.log('indooratlas postion: ', data.readDoubleBE(0), data.readDoubleBE(8), data.readDoubleBE(16));
        
        if (!unityClient)
            return;
        
        var temp = new Buffer(data.length);
        temp.writeDoubleLE(data.readDoubleBE(0), 0);
        temp.writeDoubleLE(data.readDoubleBE(8), 8);
        temp.writeDoubleLE(data.readDoubleBE(16), 16);
        
        try {
            console.log('sending to unity');
            unityClient.write(temp);
        } catch(e) {
            console.log(e);
        }
    });
    
    client.pipe(client);
}

function onUnityClientConnected(client) {
    unityClient = client;
    console.log('unity connected from: %s:%s', client.remoteAddress, client.remotePort);
    
    client.on('end', function onClientDisconnected() {
        unityClient = null;
        client.end();
        console.log('unity disconnected');
    });
    
    client.on('error', function(err) {
        unityClient = null;
        console.log(err);
        client.end();
    });
    
    client.pipe(client);
}