var protobuf = require("protobufjs");


class CattleDataPacketPayloadReader{

    readMessage(protoFilePath,messageBuffer,logger){
       
        return new Promise((resolve,reject)=>{
            try{
              
                protobuf.load(protoFilePath, function(err, root) {
                    if (err)
                        return reject( err);
                
                    try{
                        // Obtain a message type
                        var messageProt = root.lookupType("CattleProtoData.CattleDataPacket");
                            
                        logger.debug('CattleDataPacketPayloadReader - decode start ' + protoFilePath) ;
                        // Decode an Uint8Array (browser) or Buffer (node) to a message
                        var message = messageProt.decode(messageBuffer);
                    
                        logger.info('CattleDataPacketPayloadReader - decoded OK') 

                        var sensorData = [];
                        if(message.sensorData!= null && message.sensorData.length>0){
                            for(let i= 0 ;i<message.sensorData.length;i=i+2){
                                sensorData.push(message.sensorData.readUIntLE(i, 2))
                            }
                            message.sensorData =new Uint16Array( sensorData);
                        }
                        else{
                            logger.debug('CattleDataPacketPayloadReader - non sensor data present') 
                        }

                        var cattleIdHex = '';
                        for(let i= 0 ;i<message.cattleId.length-1;i++){
                            cattleIdHex +=  ((message.cattleId[i] & 0xFF).toString(16));
                        }
                        message.timeStampAsDate  =  new Date(Number( message.timeStamp) *1000).toUTCString()

                        message.cattleId = cattleIdHex.toUpperCase();
                        resolve(message);
                    }
                    catch(ex){
                        logger.error('CattleDataPacketPayloadReader readMessage failed',ex);
                        return  reject(ex);
                    }

                });
             }
             catch(ex){
                logger.error('CattleDataPacketPayloadReader readMessage failed',ex);
                return  reject(ex);
            }
        })

        


    }


}
module.exports = CattleDataPacketPayloadReader;