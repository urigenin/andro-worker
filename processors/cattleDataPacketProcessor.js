const sqlDALFactory  = require('./../utils/sqlDALFactory');
const configManager = require('./../utils/configManager');
const DeviceService = require('./../services/deviceService')
const IncomingMessageService = require('./../services/incomingMessageService') ;
const path = require('path');
const DataProcessorBase = require('./dataProcessorBase')
const {MessageTypes}  = require('./../consts');
const sqlDAL  = require('./../utils/sqlDALFactory')
const DataPacketPayloadReader = require('./../messageConverters/cattleDataPacketPayloadReader')
let filePath = path.join(__dirname,'./../protos/CattleProtoData.proto');


class CattleDataPacketProcessor extends DataProcessorBase{
    constructor(logger){
        super( logger);
    }
    async process(rowMessage){
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
                this.logger.warn('No consumer found for message for device ' +msgProcessed.devUid);
            }
            let dataForStore = {
                deviceUID:msgProcessed.devUid,
                dataConsumerId:consumerIdForTheData,
                messageTypeId:MessageTypes.MESSAGE_CATTLE_DATA_PACKET,                  
                recieveDate: new Date()
            };
            let newSensorDataArray = [];
            let mpayloadToBeSaved = Object.assign({},msgProcessed);
            for(let i = 0 ;i< msgProcessed.sensorData.length;i++){
                let val =Number( msgProcessed.sensorData[i]);
                newSensorDataArray.push(val);
            }

            var weightData = [];
            if(msgProcessed.weightDynamic!=null){
                for(let i= 0 ;i<msgProcessed.weightDynamic.length;i=i+4){
                    weightData.push(msgProcessed.weightDynamic.readUIntLE(i, 4))
                }
                mpayloadToBeSaved.weightDynamicData = weightData;
                delete msgProcessed.weightDynamic;
            }
            delete mpayloadToBeSaved.devUid;

            progresslog="1";
            mpayloadToBeSaved.sensorData=newSensorDataArray;
            progresslog="2";
            dataForStore.payload= mpayloadToBeSaved;
            
            let incomingMessageService = new IncomingMessageService(dal,this.logger);
            progresslog="3"
            let newId = await incomingMessageService.addMessage(dataForStore)
            progresslog="4"
            this.logger.info('CattleDataPacketProcessor- saved new incoming message from ' + msgProcessed.devUid + ' with id ' +newId )

            
        }
        catch(ex){
            me.logger.error('CattleDataPacketProcessor process failed ' +progresslog,ex);
           throw ex;
        }
        finally{
            if(dal)
                dal.closeConnection();
        }
    }
}
module.exports =CattleDataPacketProcessor;