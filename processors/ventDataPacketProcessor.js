const sqlDALFactory  = require('./../utils/sqlDALFactory');
const configManager = require('./../utils/configManager');
const DeviceService = require('./../services/deviceService')
const IncomingMessageService = require('./../services/incomingMessageService') ;
const path = require('path');
const DataProcessorBase = require('./dataProcessorBase')
const {MessageTypes}  = require('./../consts');
const sqlDAL  = require('./../utils/sqlDALFactory')
const DataPacketPayloadReader = require('./../messageConverters/controlUnitPacketPayloadReader')
let filePath = path.join(__dirname,'./../protos/ControlUnitProtoData.proto');


class VentDataPacketProcessor extends DataProcessorBase{
    constructor(logger){
        super( logger);
    }
    async process(rowMessage,deviceId){
        let dal = null;
        let me = this;
        let progresslog="0";
        try{
            let dataPacketPayloadReader = new DataPacketPayloadReader()

            let msgProcessed = await  dataPacketPayloadReader.readMessage(filePath,rowMessage,this.logger)

            dal = await sqlDAL.initDAL(configManager.getSQLConfig());
            
            let deviceService = new DeviceService(dal,this.logger);
            let consumerData = await deviceService.getDeviceConsumer(deviceId || msgProcessed.devUid);
            let consumerIdForTheData = null;
            if(consumerData!=null){
                consumerIdForTheData= consumerData.dataConsumerId
            }
            else{
                this.logger.warn('No consumer found for message for device ' +msgProcessed.devUid);
            }
            let dataForStore = {
                deviceUID:deviceId,
                dataConsumerId:consumerIdForTheData,
                messageTypeId:MessageTypes.MESSAGE_VENT_DATA_PACKET,                  
                recieveDate: new Date()
            };
            let newSensorDataArray = [];
            let mpayloadToBeSaved = Object.assign({},msgProcessed);
            delete mpayloadToBeSaved.devUid;

            progresslog="1";
            mpayloadToBeSaved.sensorData=newSensorDataArray;
            progresslog="2";
            dataForStore.payload= mpayloadToBeSaved;
            
            let incomingMessageService = new IncomingMessageService(dal,this.logger);
            progresslog="3"
            let newId = await incomingMessageService.addMessage(dataForStore)
            progresslog="4"
            this.logger.info('VentDataPacketProcessor- saved new incoming message from ' + msgProcessed.devUid + ' with id ' +newId )

            
        }
        catch(ex){
            me.logger.error('VentDataPacketProcessor process failed ' +progresslog,ex);
           throw ex;
        }
        finally{
            if(dal)
                dal.closeConnection()
        }
    }
}
module.exports =VentDataPacketProcessor;