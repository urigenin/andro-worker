var protobuf = require("protobufjs");
var fs = require('fs')

class TechDataPayloadReader{

    readMessage(protoFilePath,messageBuffer){
       
        return new Promise((resolve,reject)=>{

            protobuf.load(protoFilePath, function(err, root) {
                if (err)
                    return reject( err);
             
                // Obtain a message type
                var messageProt = root.lookupType("ProtoData.ThecData");
                       
                // Decode an Uint8Array (browser) or Buffer (node) to a message
                var message = messageProt.decode(messageBuffer);
            
                var sensorData = [];
                for(let i= 0 ;i<message.sensorData.length;i=i+2){
                    sensorData.push(message.sensorData.readUIntLE(i, 2))
                }
                message.sensorData =new Uint16Array( sensorData);

                resolve(message);

            });
        })

        


    }


}
module.exports = TechDataPayloadReader;