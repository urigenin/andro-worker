
const winston = require('winston');
const MqttConsumer = require('./comm/mqttConsumer')
const {getMqttBrokerDetails,getIncomingDataPacketTopic,getIncomingTopicPattern} = require('./utils/configManager')
const loggerLib = require('./utils/logger');
const DataPacketProcessor = require('./processors/dataPacketProcessor')
const logger= loggerLib.initialize(winston);

const start = async function () {

    logger.info('Worker started ');

    let mqttConsumer =  new MqttConsumer(logger);
    let dtp = new DataPacketProcessor(logger)

    await mqttConsumer.connect(getMqttBrokerDetails(),getMqttBrokerDetails().clientId,(error)=>{
        logger.error('Connection to MQTT, error')
    },()=>{
        logger.error('Connection to MQTT disconnected')
    });
    
    mqttConsumer.subscribeDelayed(getIncomingTopicPattern());

    mqttConsumer.handleMessages(
        (topic,newMessage)=> {
            logger.info('New message for topic ' +topic +'  message ' +newMessage.length);
        
            return dtp.process(newMessage).then((d)=>{
                console.log('Packet processed')
            })

        
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
     start();

}
catch(ex){
    logger.error('Server. catch error ',ex)
}