var protobuf = require("protobufjs");


class ControlUnitPacketPayloadReader{

    readMessage(protoFilePath,messageBuffer,logger){
       
        return new Promise((resolve,reject)=>{

            protobuf.load(protoFilePath, function(err, root) {
                if (err)
                    return reject( err);
             
                try{
                    // Obtain a message type
                    var messageProt = root.lookupType("ProtoData.DataPacket");
                        
                    logger.debug('ControlUnitPacketPayloadReader - decode start ' + protoFilePath) ;
                    // Decode an Uint8Array (browser) or Buffer (node) to a message
                    var message = messageProt.decode(messageBuffer);
                
                    logger.info('ControlUnitPacketPayloadReader - decoded OK') 


                    resolve(message);
                }
                catch(ex){
                    logger.error('DataPacketPayloadReader readMessage failed',ex);
                    return  reject(ex);
                }

            });
        })

    }


}
module.exports = ControlUnitPacketPayloadReader;