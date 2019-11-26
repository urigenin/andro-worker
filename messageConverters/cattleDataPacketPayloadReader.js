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
                        if(message.cattleId.length>0 &&  message.cattleId[0]<21 && message.cattleId[0]>0){
                            message.isFdx =  message.cattleId[0]==0x0F; //FDX
                            message.antenna = (message.cattleId[2] & 0x70) >> 4;
                            message.subType = 1;
                            message.antenna = message.antenna==4?3:message.antenna;
                            
                            for(let i= 3 ;i<message.cattleId.length-1;i++){
                                let hexdValue = ((message.cattleId[i] & 0xFF).toString(16));
                                if(hexdValue.length==1){
                                    hexdValue = '0' + hexdValue;
                                }
                                cattleIdHex +=  hexdValue;
                            }
                        }
                        else if(message.cattleId.length>0 &&   message.cattleId[0]==0){
                            //special message
                            message.subType = 2;
                            for(let i= 1 ;i<message.cattleId.length;i++){
                                let ascii = (message.cattleId[i] & 0xFF)
                                cattleIdHex +=  String.fromCharCode(ascii);
                            }
                            logger.info('CattleDataPacketPayloadReader - subType 2 cattle ' +cattleIdHex ) 
                        }
                        else{
                            message.subType = 3;
                            logger.info('CattleDataPacketPayloadReader - no valid cattle id - possible calibration') 
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