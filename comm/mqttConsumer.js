const mqtt = require('mqtt');
class MqttConsumer{
    constructor(logger){
        this.client = null;
        this.logger  =logger;
        this.isConnected = false;
        this.topic = '';
    }
    connect(connectionData,clientId,onError,onDisconnect){
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

                    me.logger.info('MqttConsumer successfully connected',connInfo)
                    me.isConnected = true;
                    return resolve();
                });
            //      me.client.handleMessage = function(message,callback){
            //    // me.client.on('message', function (topic, message) { 
            //             me.logger.debug('MqttConsumer - new message arrived on topic ' +message.topic)
            //             // onNewMessage(message.topic, message).then(()=>{
            //             //     callback();
            //             // })
            //     };
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
    handleMessages(onNewMessage){
        let me = this;
     
        this.client.handleMessage = function(message,callback){
            me.messageRecieved = true;
        //me.client.on('message', function (topic, message) { 
            me.logger.debug('MqttConsumer - new message arrived on topic ' +message.topic)
            onNewMessage(message.topic, message.payload).then((result)=>{
                if(result!=null && result.publish!=null){
                     me.publish(result.publish.queue,result.publish.message).then(()=>{
                        me.logger.info('Publish to queue '+ result.publish.queue + ' message of length ' + result.publish.message.length );
                       
                     })
                     callback();
                }
                else{
                    callback();
                }
            })
        };
    }
    subscribeDelayed(topicName){
        let me = this;
        setTimeout(()=>{
           
            if(me.messageRecieved==null ){
                me.logger.info('subscribeDelayed performs subscribe')
                me.subscribe(topicName);
            }
        },1000);
    }
     subscribe(topicName){
         let me = this;
        
         return new Promise((resolve,reject)=>{
            this.client.subscribe(topicName,{qos:1},function (err,granted) {
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