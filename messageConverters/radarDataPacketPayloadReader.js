var protobuf = require("protobufjs");

class RadarDataPacketPayloadReader{

    readMessage(protoFilePath,messageBuffer,logger){
       
        return new Promise((resolve,reject)=>{
            try{
              
                protobuf.load(protoFilePath, function(err, root) {
                    if (err)
                        return reject( err);
                
                    try{
                        // Obtain a message type
                        var messageProt = root.lookupType("CattleProtoData.CattleDataPacket");
                            
                        logger.debug('RadarDataPacketPayloadReader - decode start ' + protoFilePath) ;
                        // Decode an Uint8Array (browser) or Buffer (node) to a message
                        var message = messageProt.decode(messageBuffer);
                    
                        logger.info('RadarDataPacketPayloadReader - decoded OK') 

                       
                        message.height=null;
                        message.stationNumber = null;

                        if(message.sensorData!= null && message.sensorData.length>0){
                            let sensorDatStr = '';
                            //process sensor data
                            for (var i = 0; i < message.sensorData.length; i++) {
                                let charV = String.fromCharCode(parseInt(message.sensorData[i]));
                                if(message.sensorData[i]!=0 && charV!=' ')
                                    sensorDatStr += charV;
                            }
                            message.raw =  {  bytes:message.sensorData} ;
                            let sepIndex =sensorDatStr.indexOf(',');
                            if(sepIndex>0){
                                let mainParts = sensorDatStr.split(',');
                                let snValueParts =mainParts[0].split('SN-');
                                if(snValueParts.length>1){
                                    message.stationNumber = snValueParts[1];
                                }

                                let dataParts = mainParts[1].split('data-');
                                
                                message.height=dataParts[1];
                            }

                        }
                        else{
                            logger.debug('RadarDataPacketPayloadReader - non sensor data present') 
                        }



                        resolve(message);
                    }
                    catch(ex){
                        logger.error('RadarDataPacketPayloadReader readMessage failed',ex);
                        return  reject(ex);
                    }

                });
             }
             catch(ex){
                logger.error('RadarDataPacketPayloadReader readMessage failed',ex);
                return  reject(ex);
            }
        })

        


    }


}
module.exports = RadarDataPacketPayloadReader;