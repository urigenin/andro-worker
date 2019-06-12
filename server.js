
const winston = require('winston');
const MqttConsumer = require('./comm/mqttConsumer')
const {getMqttBrokerDetails,getIncomingDataPacketTopic,getIncomingTopicPattern} = require('./utils/configManager')
const loggerLib = require('./utils/logger');
const DataPacketProcessor = require('./processors/dataPacketProcessor')
const TechDataProcessor = require('./processors/techDataProcessor')

const logger= loggerLib.initialize(winston);

const start = async function () {

    

    let mqttConsumer =  new MqttConsumer(logger);
    let dtp = new DataPacketProcessor(logger)
    let tchp = new TechDataProcessor(logger);

    await mqttConsumer.connect(getMqttBrokerDetails(),getMqttBrokerDetails().clientId,(error)=>{
        logger.error('Connection to MQTT, error')
    },()=>{
        logger.error('Connection to MQTT disconnected')
    });
    
    mqttConsumer.subscribeDelayed(getIncomingTopicPattern());

    mqttConsumer.handleMessages(
        (topic,newMessage)=> {
            logger.info('New message for topic ' +topic +',  message length ' +newMessage.length);
        
            if(topic == process.env.INCOMING_DATA_PACKET_TOPIC){
           
                return dtp.process(newMessage).then((d)=>{
                    logger.info('Data Packet processed for topic ' + topic) 
                },(ex)=>{
                    
                    //
                    if(ex.toString().indexOf('index out of range')>=0)
                    {
                        logger.error('handleMessages failed - Protobuf issue  - putting into error queue',ex);
                        return mqttConsumer.publish(process.env.INCOMING_ERROR_PACKET_TOPIC +'/datapacket',newMessage);
                    }
                    else
                    {
                        logger.error('handleMessages failed ',ex);
                        throw ex;    
                    }
                })
            }
            else{
                return tchp.process(newMessage).then((d)=>{
                    logger.info('TechData Packet processed for topic ' + topic) 
                },(ex)=>{
                    
                    //
                    if(ex.toString().indexOf('index out of range')>=0)
                    {
                        logger.error('handleMessages TechData failed - Protobuf issue  - putting into error queue',ex);
                        return mqttConsumer.publish(process.env.INCOMING_ERROR_PACKET_TOPIC +'/datapacket',newMessage);
                    }
                    else
                    {
                        logger.error('handleMessages TechData failed ',ex);
                        throw ex;    
                    }
                })
                
            }
        
    });




    // let mqttConsumer2 =  new MqttConsumer(logger);

    // await mqttConsumer2.connect(getMqttBrokerDetails(),'sender',(error)=>{
    //     logger.error('Connection to MQTT, error')
    // },()=>{
    //     console.error('Connection to MQTT disconnected')
    // },(topic,newMessage)=>{
    //     console.log('New message for topic ' +topic +'  message ' +newMessage.toString())
    // });
    // await mqttConsumer2.publish(getIncomingDataPacketTopic(),"BBBB " + new Date().getTime());
 
    
}

try{
    logger.info('Worker started!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
     start();

}
catch(ex){
    logger.error('Server. catch error ',ex)
}