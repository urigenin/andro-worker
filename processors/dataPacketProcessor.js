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
            if(consumerData!=null){
                let dataForStore = {
                    deviceUID:consumerData.deviceUID,
                    dataConsumerId:consumerData.dataConsumerId,
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
                this.logger.info('DataPacketProcessor- saved new incomming message from ' + consumerData.deviceUID + ' with id ' +newId )
            }
            else{
                this.logger.warn('No consumer found for message for device ' +msgProcessed.devUid);
            }

            
        }
        catch(ex){
            me.logger.error('handleGetDataModelTypes failed ' +progresslog,ex);
           throw ex;
        }
        finally{
            if(dal)
                dal.closeConnection()
        }
    }
}
module.exports =DataPacketProcessor;