
module.exports = {
    getSQLConfig:function(){
        return process.env.DATABASE_PATH;
    },
    getMqttBrokerDetails:function(){
        return {
            address:process.env.MQTT_BROKER_ADDRESS,
            userName:process.env.MQTT_BROKER_USER_NAME,
            password:process.env.MQTT_BROKER_PASSWORD,
            clientId:process.env.MQTT_CLIENT_ID
        } 
    },
    getIncomingDataPacketTopic:function(){
        return process.env.INCOMING_DATA_PACKET_TOPIC
    },
    getIncomingTopicPattern:function(){
        return process.env.INCOMING_TOPIC_PATTERN;
    } 
}