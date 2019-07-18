
const winston = require('winston');
const MqttConsumer = require('./comm/mqttConsumer')
const {getMqttBrokerDetails,getIncomingDataPacketTopic,getIncomingTopicPattern} = require('./utils/configManager')
const loggerLib = require('./utils/logger');
const DataPacketProcessor = require('./processors/dataPacketProcessor')
const TechDataProcessor = require('./processors/techDataProcessor')
const CattleDataPacketProcessor= require('./processors/cattleDataPacketProcessor')
const logger= loggerLib.initialize(winston);

const start = async function () {

    
    // let mqttConsumerError =  new MqttConsumer(logger);

    // await mqttConsumerError.connect(getMqttBrokerDetails(),'error_writer',(error)=>{
    //     logger.error('Connection to Error MQTT, error')
    // },()=>{
    //     console.error('Connection to Error MQTT disconnected')
    // },(topic,newMessage)=>{
    //     logger.error('Error New message for topic ' +topic +'  message ' +newMessage.toString())
    // });
    // logger.info('MqttConsumerError connected OK')

    let mqttConsumer =  new MqttConsumer(logger);

    let dtp = new DataPacketProcessor(logger);
    let cattleDtp = new CattleDataPacketProcessor(logger);    
    let tchp = new TechDataProcessor(logger);
    let processors ={};
    processors[process.env.INCOMING_DATA_PACKET_TOPIC] = {module: dtp};
    processors[process.env.INCOMING_CATTLE_DATA_PACKET_TOPIC] =  {module: cattleDtp};
    processors[process.env.INCOMING_TECH_DATA_PACKET_TOPIC] =  {module: tchp};

    await mqttConsumer.connect(getMqttBrokerDetails(),getMqttBrokerDetails().clientId,(error)=>{
        logger.error('Connection to MQTT, error')
    },()=>{
        logger.error('Connection to MQTT disconnected')
    });
    
    mqttConsumer.subscribeDelayed(getIncomingTopicPattern());

    mqttConsumer.handleMessages(
        (topic,newMessage)=> {
            try{
                logger.info('New message for topic ' +topic +',  message length ' +newMessage.length);
            
                let processorRecord = processors[topic];
                let prProcess = processorRecord.module.process(newMessage);

                return prProcess.then((d)=>{
                    logger.info('Processed for topic ' + topic) 
    
                },(ex)=>{
                    
                    if(ex.toString().indexOf('out of range')>=0 || 
                    ex.toString().indexOf('invalid wire type')>=0)
                    {
                        logger.info('handleMessages failed - Protobuf issue  - putting into error queue' );
                        let topicParts  = topic.split('/');
                        let errorQ =process.env.INCOMING_ERROR_PACKET_TOPIC +'/' + topicParts[topicParts.length-2]+'/' +topicParts[topicParts.length-1]
                        return {
                        
                            publish:  {queue:errorQ,message:newMessage}
                            
                        }

                    }
                    else
                    {
                        logger.error('handleMessages failed ',ex);
                        throw ex;    
                    }
                })
            }
            catch(ex){
                logger.error('handleMessages failed ',ex);
                throw ex;    
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