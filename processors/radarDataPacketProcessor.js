const sqlDALFactory  = require('./../utils/sqlDALFactory');
const configManager = require('./../utils/configManager');
const DeviceService = require('./../services/deviceService')
const IncomingMessageService = require('./../services/incomingMessageService') ;
const path = require('path');
const DataProcessorBase = require('./dataProcessorBase')
const {MessageTypes}  = require('./../consts');
const sqlDAL  = require('./../utils/sqlDALFactory')
const DataPacketPayloadReader = require('./../messageConverters/radarDataPacketPayloadReader')
let filePath = path.join(__dirname,'./../protos/CattleProtoData.proto');


class RadarPacketProcessor extends DataProcessorBase{
    constructor(logger){
        super( logger);
    }
    async process(rowMessage,deviceUId){
        let dal = null;
        let me = this;
        let progresslog="0";
        try{
            let dataPacketPayloadReader = new DataPacketPayloadReader()

            let msgProcessed = await  dataPacketPayloadReader.readMessage(filePath,rowMessage,this.logger)

            dal = await sqlDAL.initDAL(configManager.getSQLConfig());
            
            let deviceService = new DeviceService(dal,this.logger);
            let consumerData = await deviceService.getDeviceConsumer(msgProcessed.devUid);
            let consumerIdForTheData = null;
            if(consumerData!=null){
                consumerIdForTheData= consumerData.dataConsumerId
            }
            else{
                this.logger.warn('RadarPacketProcessor - No consumer found for message for device ' +msgProcessed.devUid);
            }
            if(msgProcessed.raw==null){
                this.logger.warn('RadarPacketProcessor - no Station Number found for device ' +msgProcessed.devUid + ' packet not saved');
                return;
            }

            let dataForStore = {
                deviceUID:deviceUId,
                dataConsumerId:consumerIdForTheData,
                messageTypeId:MessageTypes.MESSAGE_RADAR_DATA_PACKET,                  
                recieveDate: new Date()
            };

            let mpayloadToBeSaved = Object.assign({},msgProcessed);

            delete mpayloadToBeSaved.sensorData;
            delete mpayloadToBeSaved.gpsString;
            delete mpayloadToBeSaved.devUid;
            delete mpayloadToBeSaved.timeStamp;
            delete mpayloadToBeSaved.hardwareVersion;


            progresslog="2";
            dataForStore.payload= mpayloadToBeSaved;
            
            let incomingMessageService = new IncomingMessageService(dal,this.logger);
            progresslog="3"
            let newId = await incomingMessageService.addMessage(dataForStore)
            progresslog="4"
            this.logger.info('RadarPacketProcessor- saved new incoming message from ' + msgProcessed.devUid + ' with id ' +newId )

            
        }
        catch(ex){
            me.logger.error('RadarPacketProcessor process failed ' +progresslog,ex);
           throw ex;
        }
        finally{
            if(dal)
                dal.closeConnection()
        }
    }
}
module.exports =RadarPacketProcessor;