const sqlDALFactory  = require('./../utils/sqlDALFactory');
const configManager = require('./../utils/configManager');
const DeviceService = require('./../services/deviceService')
const IncomingMessageService = require('./../services/incomingMessageService') ;
const path = require('path');
const DataProcessorBase = require('./dataProcessorBase')
const {MessageTypes}  = require('./../consts');
const sqlDAL  = require('./../utils/sqlDALFactory')
const DataPacketPayloadReader = require('./../messageConverters/dataPacketPayloadReader')
let filePath = path.join(__dirname,'./../protos/ProtoData.proto');


class DataPacketProcessor extends DataProcessorBase{
    constructor(logger){
        super( logger);
    }
    async process(rowMessage){
        let dal = null;
        let me = this;
        let progresslog="0";
        try{
            let dataPacketPayloadReader = new DataPacketPayloadReader()

            let msgProcessed  = await dataPacketPayloadReader.readMessage(filePath,rowMessage,this.logger)

            dal = await sqlDAL.initDAL(configManager.getSQLConfig());
            
            let deviceService = new DeviceService(dal,this.logger);
            let consumerData = await deviceService.getDeviceConsumer(msgProcessed.devUid);
            let dataConsumerId =null;
            if(consumerData!=null){
                dataConsumerId = consumerData.dataConsumerId;
                this.logger.info('DataPacketProcessor- saved new incoming message from ' + consumerData.deviceUID )
            }
            else{
                this.logger.warn('No consumer found for message for device ' +msgProcessed.devUid);
            }
            let dataForStore = {
                deviceUID:msgProcessed.devUid,
                dataConsumerId:dataConsumerId,
                messageTypeId:MessageTypes.MESSAGE_DATA_PACKET,
                
                recieveDate: new Date()
            };
            let newSensorDataArray = [];
            let mpayloadToBeSaved = {};
            for(let i = 0 ;i< msgProcessed.sensorData.length;i++){
                let val =Number( msgProcessed.sensorData[i]);
                newSensorDataArray.push(val);
            }
            let newWeightDataArray = [];
            for(let i = 0 ;i< msgProcessed.weightData.length;i++){
                let val =Number( msgProcessed.weightData[i]);
                newWeightDataArray.push(val);
            }
            progresslog="1";
            mpayloadToBeSaved.sensorData=newSensorDataArray;
            mpayloadToBeSaved.weightData=newWeightDataArray;
            mpayloadToBeSaved.firmwareVersion = msgProcessed.firmwareVersion;
            mpayloadToBeSaved.hardwareVersion = msgProcessed.hardwareVersion;
            mpayloadToBeSaved.timeStamp = msgProcessed.timeStamp;
            mpayloadToBeSaved.rssi = msgProcessed.rssi;
            mpayloadToBeSaved.battState = msgProcessed.battState;
            progresslog="2";
            dataForStore.payload= mpayloadToBeSaved;
            
            let incomingMessageService = new IncomingMessageService(dal,this.logger);
            progresslog="3"
            let newId = await incomingMessageService.addMessage(dataForStore)
            progresslog="4"

            
        }
        catch(ex){
            me.logger.error('dataPacket process failed ' +progresslog,ex);
           throw ex;
        }
        finally{
            if(dal)
                dal.closeConnection()
        }
    }
}
module.exports =DataPacketProcessor;