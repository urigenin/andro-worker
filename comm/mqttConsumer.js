const mqtt = require('mqtt');
class MqttConsumer{
    constructor(logger){
        this.client = null;
        this.logger  =logger;
        this.isConnected = false;
    }
    connect(connectionData,clientId,onError,onDisconnect,onNewMessage){
        let me = this;
        return new Promise((resolve,reject)=>{
            try{
                me.client  = mqtt.connect(connectionData.address,{
                    username:connectionData.userName,
                    password:connectionData.password,
                    // protocolId: 'MQIsdp',
                     protocolVersion: 4,
                    clean:false,
                    keepalive:60,
                    clientId:clientId
                })
                this.client.on('error',function(err){
                    me.logger.error('MqttConsumer connection error ',err)
                    onError();
                });
                this.client.on('end',function(){
                    me.logger.warn('MqttConsumer connection disconnected')
                    onDisconnect();
                });
                this.client.on('connect', function (connInfo) {

                    me.logger.info('MqttConsumer successfully connected')
                    me.isConnected = true;
                    return resolve();
                });
                me.client.on('message', function (topic, message) {
                    me.logger.debug('MqttConsumer - new message arrived on topic ' +topic)
                    onNewMessage(topic, message);
                });
            }
            catch(ex){
                me.logger.error(ex);
                return reject (ex);
            }
        })
       
    }
    publish(topicName,data){
        let me  =this;
        return new Promise((resolve,reject)=>{
            if( this.isConnected != true){
                this.logger.error('publish - No connection to the broker');
                return reject('No connection to the broker');
            }

            this.client.publish(topicName,data,{qos:1}, function (err) {
                if (err!=null) {
                    me.logger.error('Publish failed',err);
                    return reject(err);
                }
                resolve();
            });
        });
    }
     subscribe(topicName){
         let me = this;
         return new Promise((resolve,reject)=>{
            this.client.subscribe(topicName, {qos:1},function (err,granted) {
                if (err!=null) {
                    return reject(err);
                }

                me.logger.info('Mqtt subscribe ',granted)
                return resolve();
             })
         });
    }



}
module.exports = MqttConsumer;