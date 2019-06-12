var protobuf = require("protobufjs");
var fs = require('fs')

class TechDataPayloadReader{

    readMessage(protoFilePath,messageBuffer){
       
        return new Promise((resolve,reject)=>{

            protobuf.load(protoFilePath, function(err, root) {
                if (err)
                    return reject( err);
             
                // Obtain a message type
                var messageProt = root.lookupType("ProtoData.TechData");
                       
                // Decode an Uint8Array (browser) or Buffer (node) to a message
                var message = messageProt.decode(messageBuffer);
            
    
                resolve(message);

            });
        })

        


    }


}
module.exports = TechDataPayloadReader;