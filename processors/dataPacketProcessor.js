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
        try{
            let dataPacketPayloadReader = new DataPacketPayloadReader()

            let msgProcessed  = await dataPacketPayloadReader.readMessage(filePath,rowMessage)

            dal = await sqlDAL.initDAL(configManager.getSQLConfig());
            
            let deviceService = new DeviceService(dal,this.logger);
            let consumerData = deviceService.getDeviceConsumer(msgProcessed.devUid);
            if(consumerData!=null){
                let messageForStore = {
                    deviceUID:consumerData.deviceUID,
                    dataConsumerId:consumerData.dataConsumerId,
                    messageTypeId:MessageTypes.MESSAGE_DATA_PACKET,
                    payload:msgProcessed,
                    recieveDate: new Date()
                };
                let incomingMessageService = new IncomingMessageService(dal,this.logger);
                await incomingMessageService.addMessage(messageForStore)
            }
            else{
                this.logger.warn('No consumer found for message for device ' +msgProcessed.devUid);
            }

            
        }
        catch(ex){
            me.logger.error('handleGetDataModelTypes failed' ,ex);
            return (Boom.badImplementation("unable to process request - Server Error"));
        }
        finally{
            dal.closeConnection()
        }
    }
}
module.exports =DataPacketProcessor;